import {
	ChangeDetectorRef,
	Component,
	ElementRef,
	OnInit,
	Renderer2,
	ViewChild
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSelect } from '@angular/material/select';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '@services/api.service';
import { AppService } from '@services/app.service';
import { FormService } from '@services/form.service';
import { RoutingService } from '@services/routing.service';
import { SliceService } from '@services/slice.service';
import { sortBy, orderBy, cloneDeep, head, tail, last } from 'lodash';
import { BehaviorSubject, of } from 'rxjs';
import {
	faCaretDown
} from '@fortawesome/free-solid-svg-icons';
import {
	catchError,
	map,
	switchMap,
	take,
	takeWhile,
	tap
} from 'rxjs/operators';
import {
	FormParams,
	FORM_ERROR_CODES,
	FORM_MODE
} from 'src/app/form/form.defs';
import { DlForm } from 'src/app/form/models/container';
import { RoutedFormComponent } from 'src/app/form/routed-form/routed-form.component';
import { JotMetaPresentationForm } from 'src/app/shared/models/jot';
import { Slice } from 'src/app/shared/models/slice';
import {
	MatAutocomplete,
	MatAutocompleteTrigger
} from '@angular/material/autocomplete';
interface FetchSignature {
	slice?: Slice;
	record?: number;
	formId?: string | number;
	form?: DlForm | JotMetaPresentationForm;
	mode?: FORM_MODE;
	reportId?: any;
}

@Component({
	selector: 'app-where-condition',
	templateUrl: './where.component.html',
	styleUrls: ['./where.component.scss']
})
export class WhereComponent implements OnInit {
	faArrowDown = faCaretDown;
	@ViewChild('textBlockElement ', { static: false })
	textBlockElement: ElementRef;

	@ViewChild('matSelect')
	matSelect: MatSelect;

	@ViewChild('autoc')
	autoc: MatAutocomplete;

	@ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger;

	textFormulaElement = null;
	customFormulaLabel = null;
	customFormulaOldLabel = null;
	insertField = null;
	allFields = [];
	onShift = false;

	dataSource = new MatTableDataSource([]);
	isExpandInProgress = false;
	formParams: FormParams;
	selectedFormulaField = null;

	navData = new MatTableDataSource([]);
	editAppSlice: number;

	rolesData = new MatTableDataSource([]);
	private _destroyed = false;
	parentSliceId = null;
	reportSliceId = null;
	reportInfoMain: Slice = null;
	reportInfoNonParent: Slice = null;
	mode = 'create';
	error?: FORM_ERROR_CODES;
	loading = new BehaviorSubject(true);

	nestedWhereGenerator = [];

	whereIterations: any[] = [
		{
			name: 'test',
			control: new FormControl(),
			controlValue: new FormControl(),
			children: [],
			expression: new FormControl(),
			expressionOpts: new FormControl(),
			messageControl: new FormControl(),
			defaultValueControl: new FormControl(),
			dateAndPromptSelectorControl: new FormControl(),
			selectedDate: new FormControl(),
			futureOrPastDaysControl: new FormControl(0),
			selectField: new FormControl(),
			selectParameter: new FormControl(),
			dropdownValues: []
		}
	];
	dateAndPromptOpts: any[] = ['Prompt User', 'Pick a Date'];
	andOrOpts: any[] = [
		{ id: '$and', value: 'All' },
		{ id: '$or', value: 'Any' }
	];
	mainCondition = head(this.andOrOpts);
	_wrapInDate = function (v) {
		return ['$date', v];
	};

	dateOpts = [
		{
			id: 'select',
			name: 'select date...',
			valueWidget: 'DateTextBox',
			canPrompt: 'date',
			checker: function (v) {
				// ['$date', DATETIMEOBJ]
				return (
					v instanceof Date ||
					(v[0] &&
						v[0] == '$date' &&
						v[1] &&
						Object.prototype.toString.call(v[1]) == '[object Date]')
				);
			},
			extractValue: function (v) {
				return v instanceof Date ? v : v[1];
			},
			wrapper: this._wrapInDate,
			getValue: function (v) {
				return ['$date', { '$/tools/date': v }];
			}
		},
		{
			id: 'selectField',
			name: 'select field...',
			valueWidget: 'FieldSelect',
			wrapper: this._wrapInDate,
			checker: function (v) {
				// ['$date', ['$field', xxxx]]
				return (
					v[0] &&
					v[0] == '$date' &&
					v[1] &&
					v[1][0] &&
					v[1][0] == '$field'
				);
			},
			extractValue: function (v) {
				return v[1] && v[1][1] ? v[1][1] : '';
			},
			getValue: function (v) {
				return ['$date', ['$field', v]];
			}
		},
		{
			id: 'today',
			name: 'Today',
			checker: function (v) {
				// ['$date', ['$now']]
				return (
					v[0] &&
					v[0] == '$date' &&
					v[1] &&
					v[1][0] &&
					v[1][0] == '$now'
				);
			},
			wrapper: this._wrapInDate,
			getValue: function (v) {
				return ['$date', ['$now']];
			}
		},
		{
			id: 'now',
			name: 'Now',
			checker: function (v) {
				// ['$now']
				return v[0] && v[0] == '$now';
			},
			getValue: function (v) {
				return ['$now'];
			}
		},
		{
			id: 'yesterday',
			name: 'Yesterday',
			checker: function (v) {
				// ['$date', ['$timestampadd', 'days', -1, ['$now']]]
				return (
					(v[0] && v[0] == '$yesterday') ||
					(v[0] &&
						v[0] == '$date' &&
						v[1] &&
						v[1][0] &&
						v[1][0] == '$timestampadd' &&
						parseInt(v[1][2]) == -1)
				);
			},
			wrapper: this._wrapInDate,
			getValue: function (v) {
				return this.wrapper(['$timestampadd', 'days', -1, ['$now']]);
			}
		},
		{
			id: 'tomorrow',
			name: 'Tomorrow',
			checker: function (v) {
				return (
					(v[0] && v[0] == '$tomorrow') ||
					(v[0] &&
						v[0] == '$date' &&
						v[1] &&
						v[1][0] &&
						v[1][0] == '$timestampadd' &&
						parseInt(v[1][2]) == 1)
				);
			},
			wrapper: this._wrapInDate,
			getValue: function (v) {
				return this.wrapper(['$timestampadd', 'days', 1, ['$now']]);
			}
		},
		{
			id: 'daysfuture',
			name: 'day(s) in the future',
			valueWidget: 'NumberSpinner',
			checker: function (v) {
				return (
					v[0] &&
					v[0] == '$date' &&
					v[1] &&
					v[1][0] &&
					v[1][0] == '$timestampadd' &&
					parseInt(v[1][2]) > 1
				);
			},
			wrapper: this._wrapInDate,
			extractValue: function (v) {
				return parseInt(v[1][2]);
			},
			getValue: function (v) {
				return this.wrapper([
					'$timestampadd',
					'days',
					parseInt(v),
					['$now']
				]);
			}
		},
		{
			id: 'dayspast',
			name: 'day(s) in the past',
			valueWidget: 'NumberSpinner',
			checker: function (v) {
				return (
					v[0] &&
					v[0] == '$date' &&
					v[1] &&
					v[1][0] &&
					v[1][0] == '$timestampadd' &&
					parseInt(v[1][2]) < -1
				);
			},
			wrapper: this._wrapInDate,
			extractValue: function (v) {
				return Math.abs(parseInt(v[1][2]));
			},
			getValue: function (v) {
				return this.wrapper([
					'$timestampadd',
					'days',
					0 - parseInt(v),
					['$now']
				]);
			}
		}
	];

	expressionFieldsByType = {
		control_formula_html: {
			data: [
				{ id: '$eq', label: 'is exactly' },
				{ id: '$neq', label: 'is not exactly' },
				{ id: '$contains', label: 'contains' },
				{ id: '$ncontains', label: 'does not contain' },
				{ id: '$starts_with', label: 'starts with' },
				{ id: '$nstarts_with', label: 'does not start with' },
				{ id: '$ends_with', label: 'ends with' },
				{ id: '$nends_with', label: 'does not end with' },
				{ id: '$emptystring', label: 'is empty', noValue: true },
				{ id: '$nemptystring', label: 'is not empty', noValue: true }
			],
			selectionOpts: [
				{ id: '__@1@__', name: 'select field...', system: true },
				{ id: '__@2@__', name: 'select parameter...', system: true },
				{ id: '__@3@__', name: 'prompt user...', system: true }
			]
		},
		customFormula: {
			data: [
				{ id: '$eq', label: 'is exactly' },
				{ id: '$neq', label: 'is not exactly' },
				{ id: '$contains', label: 'contains' },
				{ id: '$ncontains', label: 'does not contain' },
				{ id: '$starts_with', label: 'starts with' },
				{ id: '$nstarts_with', label: 'does not start with' },
				{ id: '$ends_with', label: 'ends with' },
				{ id: '$nends_with', label: 'does not end with' },
				{ id: '$emptystring', label: 'is empty', noValue: true },
				{ id: '$nemptystring', label: 'is not empty', noValue: true }
			],
			selectionOpts: [
				{ id: '__@1@__', name: 'select field...', system: true },
				{ id: '__@2@__', name: 'select parameter...', system: true },
				{ id: '__@3@__', name: 'prompt user...', system: true }
			]
		},
		control_dropdown: {
			data: [
				{ id: '$eq', label: 'is exactly' },
				{ id: '$neq', label: 'is not exactly' },
				{ id: '$contains', label: 'contains' },
				{ id: '$ncontains', label: 'does not contain' },
				{ id: '$starts_with', label: 'starts with' },
				{ id: '$nstarts_with', label: 'does not start with' },
				{ id: '$ends_with', label: 'ends with' },
				{ id: '$nends_with', label: 'does not end with' },
				{ id: '$emptystring', label: 'is empty', noValue: true },
				{ id: '$nemptystring', label: 'is not empty', noValue: true }
			],
			selectionOpts: [
				{ id: '__@1@__', name: 'select field...', system: true },
				{ id: '__@2@__', name: 'select parameter...', system: true },
				{ id: '__@3@__', name: 'prompt user...', system: true }
			]
		},
		control_related_dropdown: {
			data: [
				{ id: '$eq', label: 'is exactly' },
				{ id: '$neq', label: 'is not exactly' },
				{ id: '$contains', label: 'contains' },
				{ id: '$ncontains', label: 'does not contain' },
				{ id: '$starts_with', label: 'starts with' },
				{ id: '$nstarts_with', label: 'does not start with' },
				{ id: '$ends_with', label: 'ends with' },
				{ id: '$nends_with', label: 'does not end with' },
				{ id: '$emptystring', label: 'is empty', noValue: true },
				{ id: '$nemptystring', label: 'is not empty', noValue: true }
			],
			selectionOpts: [
				{ id: '__@1@__', name: 'select field...', system: true },
				{ id: '__@2@__', name: 'select parameter...', system: true },
				{ id: '__@3@__', name: 'prompt user...', system: true }
			]
		},
		control_textarea: {
			data: [
				{ id: '$eq', label: 'is exactly' },
				{ id: '$neq', label: 'is not exactly' },
				{ id: '$contains', label: 'contains' },
				{ id: '$ncontains', label: 'does not contain' },
				{ id: '$starts_with', label: 'starts with' },
				{ id: '$nstarts_with', label: 'does not start with' },
				{ id: '$ends_with', label: 'ends with' },
				{ id: '$nends_with', label: 'does not end with' },
				{ id: '$emptystring', label: 'is empty', noValue: true },
				{ id: '$nemptystring', label: 'is not empty', noValue: true }
			],
			selectionOpts: [
				{ id: '__@1@__', name: 'select field...', system: true },
				{ id: '__@2@__', name: 'select parameter...', system: true },
				{ id: '__@3@__', name: 'prompt user...', system: true }
			]
		},
		control_textbox: {
			data: [
				{ id: '$eq', label: 'is exactly' },
				{ id: '$neq', label: 'is not exactly' },
				{ id: '$contains', label: 'contains' },
				{ id: '$ncontains', label: 'does not contain' },
				{ id: '$starts_with', label: 'starts with' },
				{ id: '$nstarts_with', label: 'does not start with' },
				{ id: '$ends_with', label: 'ends with' },
				{ id: '$nends_with', label: 'does not end with' },
				{ id: '$emptystring', label: 'is empty', noValue: true },
				{ id: '$nemptystring', label: 'is not empty', noValue: true }
			],
			selectionOpts: [
				{ id: '__@1@__', name: 'select field...', system: true },
				{ id: '__@2@__', name: 'select parameter...', system: true },
				{ id: '__@3@__', name: 'prompt user...', system: true }
			]
		},
		control_formula_text: {
			data: [
				{ id: '$eq', label: 'is exactly' },
				{ id: '$neq', label: 'is not exactly' },
				{ id: '$contains', label: 'contains' },
				{ id: '$ncontains', label: 'does not contain' },
				{ id: '$starts_with', label: 'starts with' },
				{ id: '$nstarts_with', label: 'does not start with' },
				{ id: '$ends_with', label: 'ends with' },
				{ id: '$nends_with', label: 'does not end with' },
				{ id: '$emptystring', label: 'is empty', noValue: true },
				{ id: '$nemptystring', label: 'is not empty', noValue: true }
			],
			selectionOpts: [
				{ id: '__@1@__', name: 'select field...', system: true },
				{ id: '__@2@__', name: 'select parameter...', system: true },
				{ id: '__@3@__', name: 'prompt user...', system: true }
			]
		},
		control_radio: {
			data: [
				{ id: '$eq', label: 'is exactly' },
				{ id: '$neq', label: 'is not exactly' },
				{ id: '$contains', label: 'contains' },
				{ id: '$ncontains', label: 'does not contain' },
				{ id: '$starts_with', label: 'starts with' },
				{ id: '$nstarts_with', label: 'does not start with' },
				{ id: '$ends_with', label: 'ends with' },
				{ id: '$nends_with', label: 'does not end with' },
				{ id: '$emptystring', label: 'is empty', noValue: true },
				{ id: '$nemptystring', label: 'is not empty', noValue: true }
			],
			selectionOpts: [
				{ id: '__@1@__', name: 'select field...', system: true },
				{ id: '__@2@__', name: 'select parameter...', system: true },
				{ id: '__@3@__', name: 'prompt user...', system: true }
			]
		},
		control_checkbox: {
			data: [
				{
					id: '$eq',
					label: 'is true',
					noValue: true,
					forceValue: function (f) {
						return f; // ****** CORNER CASE (see _preParse);
					}
				},
				{
					id: '$empty',
					label: 'is false',
					noValue: true,
					forceValue: function (f) {
						return ['$empty', f]; // ****** CORNER CASE (see _preParse);
					}
				}
			]
		},
		control_date: {
			data: [
				{ id: '$eq', label: 'is on' },
				{ id: '$neq', label: 'is not on' },
				{ id: '$gt', label: 'is after' },
				{ id: '$gte', label: 'is on or after' },
				{ id: '$lt', label: 'is before' },
				{ id: '$lte', label: 'is on or before' },
				{ id: '$emptydate', label: 'is empty', noValue: true },
				{ id: '$nemptydate', label: 'is not empty', noValue: true }
			],
			selectionOpts: this.dateOpts
		},
		control_new_datetime: {
			data: [
				{ id: '$eq', label: 'is on' },
				{ id: '$neq', label: 'is not on' },
				{ id: '$gt', label: 'is after' },
				{ id: '$gte', label: 'is on or after' },
				{ id: '$lt', label: 'is before' },
				{ id: '$lte', label: 'is on or before' },
				{ id: '$emptydate', label: 'is empty', noValue: true },
				{ id: '$nemptydate', label: 'is not empty', noValue: true }
			],
			selectionOpts: this.dateOpts
		},
		control_formula_date: {
			data: [
				{ id: '$eq', label: 'is on' },
				{ id: '$neq', label: 'is not on' },
				{ id: '$gt', label: 'is after' },
				{ id: '$gte', label: 'is on or after' },
				{ id: '$lt', label: 'is before' },
				{ id: '$lte', label: 'is on or before' },
				{ id: '$emptydate', label: 'is empty', noValue: true },
				{ id: '$nemptydate', label: 'is not empty', noValue: true }
			],
			selectionOpts: this.dateOpts
		},
		control_formula_date_time: {
			data: [
				{ id: '$eq', label: 'is on' },
				{ id: '$neq', label: 'is not on' },
				{ id: '$gt', label: 'is after' },
				{ id: '$gte', label: 'is on or after' },
				{ id: '$lt', label: 'is before' },
				{ id: '$lte', label: 'is on or before' },
				{ id: '$emptydate', label: 'is empty', noValue: true },
				{ id: '$nemptydate', label: 'is not empty', noValue: true }
			],
			selectionOpts: this.dateOpts
		},
		control_number: {
			data: [
				{ id: '$eq', label: 'equals' },
				{ id: '$neq', label: 'not equal to' },
				{ id: '$gt', label: 'is greater than' },
				{ id: '$gte', label: 'is greater than or equal to' },
				{ id: '$lt', label: 'is less than' },
				{ id: '$lte', label: 'is less than or equal to' },
				{
					id: '$is',
					label: 'is not set',
					noValue: true,
					forceValue: function (f) {
						return ['$is', f, null]; // ****** CORNER CASE (see _preParse);
					}
				}
			],
			selectionOpts: [
				{ id: '__@1@__', name: 'select field...', system: true },
				{ id: '__@2@__', name: 'select parameter...', system: true },
				{ id: '__@3@__', name: 'prompt user...', system: true }
			]
		},
		AUTH: {
			data: [
				{
					id: '$eq',
					label: 'is the current user',
					noValue: true,
					forceValue: function (f) {
						return ['$eq', f, ['$viewer']]; // ****** CORNER CASE (see _preParse);
					}
				},
				{
					id: '$neq',
					label: 'is not the current user',
					noValue: true,
					forceValue: function (f) {
						return ['$neq', f, ['$viewer']]; // ****** CORNER CASE (see _preParse);
					}
				}
			]
		}
	};
	constructor(
		public app: AppService,
		private _slices: SliceService,
		private _route: ActivatedRoute,
		private router: Router,
		private _cd: ChangeDetectorRef,
		private _forms: FormService,
		private _api: ApiService,
		private _routing: RoutingService,
		private renderer: Renderer2
	) {}

	private _clear() {
		this.formParams = null;
		this.error = null;
	}

	ngOnInit(): void {
		this.app.auth
			.pipe(
				takeWhile(() => !this._destroyed),
				switchMap((auth) =>
					this._route.paramMap.pipe(
						tap(() => {
							this._clear();
							this._cd.detectChanges();
							this.loading.next(true);
						}),
						switchMap((p) =>
							this._slices
								.fetch(p.get('sliceid'), {
									includeRootMeta: true
								})
								.pipe(
									map(
										(s) =>
											({
												slice: s,
												formId: p.get('form'),
												form: s.getFormContainer(
													p.get('form')
												),
												reportId: p.get('reportid'),
												mode: p.get('mode') as FORM_MODE
											} as FetchSignature)
									),
									catchError((err) => {
										this.error =
											FORM_ERROR_CODES.SLICE_NOT_FOUND;
										return of<FetchSignature>({});
									})
								)
						)
					)
				)
			)
			.subscribe((p) => {
				this._load(p);
				this.getAllFields(p);
			});
	}

	getExpressionsByType(fieldInfo) {
		const type = fieldInfo.control.value.f.type;
		return this.expressionFieldsByType[type].data;
	}
	getExpressionOptsByType(fieldInfo) {
		const type = fieldInfo.control.value.f.type;
		return this.expressionFieldsByType[type].selectionOpts;
	}

	removeIteration(group, parent) {
		if (this.whereIterations.length) {
			this.getAndRemoveMatchedObject(group);
		}
		if (!this.whereIterations.length) {
			this.whereIterations = [
				{
					name: 'test',
					control: new FormControl(),
					controlValue: new FormControl(),
					expression: new FormControl(),
					expressionOpts: new FormControl(),
					messageControl: new FormControl(),

					defaultValueControl: new FormControl(),
					dateAndPromptSelectorControl: new FormControl(),
					selectedDate: new FormControl(),
					futureOrPastDaysControl: new FormControl(0),
					selectField: new FormControl(),
					selectParameter: new FormControl(),
					dropdownValues: [],
					children: []
				}
			];
		}
		this.setParent(this.whereIterations, null);
	}

	radioChange(data) {
		this.mainCondition=data.id;
	}

	addIteration(itr, index) {
		if (itr.children) {
			itr.children.push({
				name: 'd' + Math.random(),
				control: new FormControl(),
				controlValue: new FormControl(),
				expression: new FormControl(),
				expressionOpts: new FormControl(),
				messageControl: new FormControl(),

				defaultValueControl: new FormControl(),
				dateAndPromptSelectorControl: new FormControl(),
				selectedDate: new FormControl(),
				futureOrPastDaysControl: new FormControl(0),
				selectField: new FormControl(),
				selectParameter: new FormControl(),
				dropdownValues: []
			});
		} else {
			itr.children = [];
			itr.children.push({
				name: 'd' + Math.random(),
				control: new FormControl(),
				controlValue: new FormControl(),
				expression: new FormControl(),
				expressionOpts: new FormControl(),
				messageControl: new FormControl(),

				defaultValueControl: new FormControl(),
				dateAndPromptSelectorControl: new FormControl(),
				selectedDate: new FormControl(),
				futureOrPastDaysControl: new FormControl(0),
				selectField: new FormControl(),
				selectParameter: new FormControl(),
				dropdownValues: []
			});
		}

		this.setParent(this.whereIterations, null);
	}

	setParent(whereIterations, parent) {
		whereIterations.forEach((y) => {
			y.parent = parent;

			if (y.children && y.children.length) {
				this.setParent(y.children, y);
			}
		});
	}

	addIterationParent() {
		this.whereIterations.unshift({
			name: 'd' + Math.random(),
			control: new FormControl(),
			controlValue: new FormControl(),
			expression: new FormControl(),
			expressionOpts: new FormControl(),
			messageControl: new FormControl(),
			defaultValueControl: new FormControl(),
			dateAndPromptSelectorControl: new FormControl(),
			selectedDate: new FormControl(),
			futureOrPastDaysControl: new FormControl(0),
			selectField: new FormControl(),
			selectParameter: new FormControl(),
			dropdownValues: []
		});
		this.setParent(this.whereIterations, null);
	}

	addConditionDropDown(group = null) {
		if (!group) {
			this.whereIterations = [
				{
					name: 'd' + Math.random(),
					isCondition: true,
					conditionControl: new FormControl(head(this.andOrOpts)),
					children: this.whereIterations,
					expression: new FormControl(),
					expressionOpts: new FormControl(),
					messageControl: new FormControl(),
					defaultValueControl: new FormControl(),
					dateAndPromptSelectorControl: new FormControl(),
					selectedDate: new FormControl(),
					futureOrPastDaysControl: new FormControl(0),
					selectField: new FormControl(),
					selectParameter: new FormControl(),
					dropdownValues: []
				}
			];
		} else {
			this.getAndUpdateMatchedObject(group);
		}
		this.setParent(this.whereIterations, null);
	}

	getAndUpdateMatchedObject(group) {
		let matchedObject = null;
		this.whereIterations.forEach((element, i) => {
			if (element === group) {
				this.whereIterations[i] = {
					name: 'd' + Math.random(),
					isCondition: true,
					conditionControl: new FormControl(head(this.andOrOpts)),
					children: [group],
					expression: new FormControl(),
					expressionOpts: new FormControl(),
					messageControl: new FormControl(),

					defaultValueControl: new FormControl(),
					dateAndPromptSelectorControl: new FormControl(),
					selectedDate: new FormControl(),
					futureOrPastDaysControl: new FormControl(0),
					selectField: new FormControl(),
					selectParameter: new FormControl(),
					dropdownValues: []
				};
			} else if (element.children) {
				this.searchNested(element.children, group);
			}
		});

		return matchedObject;
	}

	searchNested(element, group) {
		let matchedObject = null;
		element.forEach((t, i) => {
			if (t === group) {
				matchedObject = t;
				element[i] = {
					name: 'd' + Math.random(),
					isCondition: true,
					conditionControl: new FormControl(head(this.andOrOpts)),
					children: [group],
					expression: new FormControl(),
					expressionOpts: new FormControl(),
					messageControl: new FormControl(),

					defaultValueControl: new FormControl(),
					dateAndPromptSelectorControl: new FormControl(),
					selectedDate: new FormControl(),
					futureOrPastDaysControl: new FormControl(0),
					selectField: new FormControl(),
					selectParameter: new FormControl(),
					dropdownValues: []
				};
			} else if (t.children) {
				this.searchNested(t.children, group);
			}
		});
		return matchedObject;
	}

	getAndRemoveMatchedObject(group) {
		let matchedObject = null;
		let isAllParentConditional = false;
		this.whereIterations.forEach((element, i) => {
			if (element === group) {
				this.whereIterations.splice(i, 1);
			} else if (element.children) {
				this.searchAndRemoveNested(element.children, group);
			}
		});

		return matchedObject;
	}

	searchAndRemoveNested(element, group) {
		let matchedObject = null;
		element.forEach((t, i) => {
			if (t === group) {
				matchedObject = t;
				if (element.length === 1) {
					this.getAndRemoveMatchedObject(t.parent);
				}
				element.splice(i, 1);
			} else if (t.children) {
				this.searchAndRemoveNested(t.children, group);
			}
		});
		return matchedObject;
	}

	moveUpConditionDropDown(group) {
		this.getAndMoveUpMatchedObject(group);
		this.setParent(this.whereIterations, null);
	}

	getAndMoveUpMatchedObject(group) {
		let matchedObject = null;
		this.whereIterations.forEach((element, i) => {
			if (element === group) {
				this.whereIterations[i] = {};
				this.whereIterations.splice(i, 1);
			} else if (element.children) {
				this.searchAndMoveUpNested(element.children, group);
			}
		});

		return matchedObject;
	}

	searchAndMoveUpNested(elements, group) {
		let matchedObject = null;
		elements.forEach((t, i) => {
			if (t === group) {
				if (t.parent) {
					this.removeParentAndShiftUp(t.parent, group);
				} else {
					this.replaceChildWithParent(parent, group);
				}

				matchedObject = t;
			} else if (t.children) {
				this.searchAndMoveUpNested(t.children, group);
			}
		});
		return matchedObject;
	}

	removeParentAndShiftUp(parent, element) {
		if (parent.parent) {
			this.addToSuperParent(parent.parent, element);
			this.getAndRemoveMatchedObject(parent);
		} else {
			this.replaceChildWithParent(parent, element);
		}
	}

	replaceChildWithParent(parent, element) {
		let matchedObject = null;
		let isAllParentConditional = false;
		this.whereIterations.forEach((e, i) => {
			if (e === parent) {
				this.whereIterations[i] = element;
			} else if (e.children) {
				this.searchAndReplaceChildWithParentNested(
					e.children,
					parent,
					element
				);
			}
		});

		return matchedObject;
	}

	searchAndReplaceChildWithParentNested(elements, parent, elmtToReplace) {
		let matchedObject = null;
		elements.forEach((t, i) => {
			if (t === parent) {
				elements[i] = elmtToReplace;
			} else if (t.children) {
				this.searchAndReplaceChildWithParentNested(
					t.children,
					parent,
					elmtToReplace
				);
			}
		});
		return matchedObject;
	}

	addToSuperParent(superParent, element) {
		let matchedObject = null;
		let isAllParentConditional = false;
		this.whereIterations.forEach((e, i) => {
			if (e === superParent) {
				this.whereIterations[i].children
					? this.whereIterations[i].children.push(element)
					: (this.whereIterations[i].children = [element]);
			} else if (e.children) {
				this.searchAndToSuperParentNested(
					e.children,
					superParent,
					element
				);
			}
		});

		return matchedObject;
	}

	searchAndToSuperParentNested(elements, superParent, elmtToMove) {
		let matchedObject = null;
		elements.forEach((t, i) => {
			if (t === superParent) {
				matchedObject = t;
				elements[i].children
					? elements[i].children.push(elmtToMove)
					: (elements[i].children = [elmtToMove]);
			} else if (t.children) {
				this.searchAndToSuperParentNested(
					t.children,
					superParent,
					elmtToMove
				);
			}
		});
		return matchedObject;
	}

	setWhereConditions(whereIterations) {
		if (whereIterations.length) {
			this.whereIterations = [];
			this.mainCondition = this.getConditionField(whereIterations[0]);

			[whereIterations[1]].forEach((e) => {
				if (e instanceof Array) {
					const parent = e[0];
					if (parent === '$and' || parent === '$or') {
						const mainP = {
							condition: parent,
							children: []
						};
						this.updateChildrenNested(e.slice(1, e.length), mainP);
						this.nestedWhereGenerator.push(mainP);
					} else {
						this.nestedWhereGenerator.push(e);
					}
				}
			});

			this.constructWhereIterations();
		}
	}

	constructWhereIterations() {
		this.nestedWhereGenerator.forEach((y, id) => {
			if (y && y.condition) {
				this.nestedWhereGenerator[id] = {
					name: 'd' + Math.random(),
					isCondition: true,
					conditionControl: new FormControl(
						this.getConditionField(y.condition)
					),
					children: y.children,
					expression: new FormControl(),
					expressionOpts: new FormControl(),
					messageControl: new FormControl(),

					defaultValueControl: new FormControl(),
					dateAndPromptSelectorControl: new FormControl(),
					selectedDate: new FormControl(),
					futureOrPastDaysControl: new FormControl(0),
					selectField: new FormControl(),
					selectParameter: new FormControl(),
					dropdownValues: []
				};
				this.contructNestedChildren(y.children);
			} else {
				this.nestedWhereGenerator[id] = this.constructFieldControls(y);
			}
		});

		this.whereIterations = this.nestedWhereGenerator;
	}

	constructFieldControls(y: any[]) {
		const fields: string[] = y.toString().split(',');
		// Boolean
		if (fields.length === 2 || fields.some((y) => y === '$empty')) {
			if (fields.some((y) => y === '$empty')) {
				return {
					name: 'd' + Math.random(),
					control: new FormControl({
						id: fields[2],
						f: { type: 'control_checkbox' }
					}),
					controlValue: new FormControl(fields[2]),
					expression: new FormControl(
						this.expressionFieldsByType[
							'control_checkbox'
						].data.find((u) => u.id === '$empty')
					),
					expressionOpts: new FormControl(),
					messageControl: new FormControl(),

					defaultValueControl: new FormControl(),
					dateAndPromptSelectorControl: new FormControl(),
					selectedDate: new FormControl(),
					futureOrPastDaysControl: new FormControl(0),
					selectField: new FormControl(),
					selectParameter: new FormControl(),
					dropdownValues: []
				};
			} else {
				return {
					name: 'd' + Math.random(),
					control: new FormControl({
						id: fields[1],
						f: { type: 'control_checkbox' }
					}),
					controlValue: new FormControl(fields[1]),
					expression: new FormControl(
						this.expressionFieldsByType[
							'control_checkbox'
						].data.find((u) => u.id === '$eq')
					),
					expressionOpts: new FormControl(),
					messageControl: new FormControl(),

					defaultValueControl: new FormControl(),
					dateAndPromptSelectorControl: new FormControl(),
					selectedDate: new FormControl(),
					futureOrPastDaysControl: new FormControl(0),
					selectField: new FormControl(),
					selectParameter: new FormControl(),
					dropdownValues: []
				};
			}
		} else {
			const typeOpts = this.getFieldType(fields[0]);
			if (fields.length === 5) {
				return {
					name: 'd' + Math.random(),
					control: new FormControl({
						id: fields[3],
						f: { type: typeOpts.type }
					}),
					controlValue: new FormControl(fields[1]),
					expression: new FormControl(typeOpts.opts),
					expressionOpts: new FormControl(
						this.expressionFieldsByType[
							typeOpts.type
						].selectionOpts.find((u) => u.id === '__@1@__')
					),
					messageControl: new FormControl(),

					defaultValueControl: new FormControl(),
					dateAndPromptSelectorControl: new FormControl(),
					selectedDate: new FormControl(),
					futureOrPastDaysControl: new FormControl(0),
					selectField: new FormControl({
						id: fields[4],
						f: { type: typeOpts.type }
					}),
					selectParameter: new FormControl(),
					dropdownValues: []
				};
			}
		}
	}

	getSetWhereForTextField(
		expression,
		expressionOpts,
		controlValue,
		y,
		whereFields
	) {
		if (!expression.noValue) {
			if (expressionOpts.id === '__@1@__') {
				const selectField =
					y.selectField.value.id || y.selectField.value;
				const subWhere = [
					expression.id,
					['$field', controlValue],
					['$field', selectField]
				];
				whereFields.push(subWhere);
			} else if (expressionOpts.id === '__@2@__') {
				const selectParameter =
					y.selectParameter.value.relationName ||
					y.selectParameter.value.id ||
					y.selectParameter.value;
				const subWhere = [
					expression.id,
					['$field', controlValue],
					['$sysparam', selectParameter]
				];
				whereFields.push(subWhere);
			} else if (expressionOpts.id === '__@3@__') {
				const messageField = y.messageControl.value;
				const defaultValue = y.defaultValueControl.value;
				const subWhere = [
					expression.id,
					['$field', controlValue],
					['$userparam', messageField, defaultValue]
				];
				whereFields.push(subWhere);
			} else {
				const subWhere = [
					expression.id,
					['$field', controlValue],
					expressionOpts
				];
				whereFields.push(subWhere);
			}
		} else {
			const subWhere = [expression.id, ['$field', controlValue]];
			whereFields.push(subWhere);
		}
	}

	getSetWhereForDateField(
		expression,
		expressionOpts,
		controlValue,
		y,
		whereFields
	) {
		if (!expression.noValue) {
			if (expressionOpts.id === 'select') {
				if (y.dateAndPromptSelectorControl.value === 'Pick a Date') {
					const selectedDate = y.selectedDate.value;
					const subWhere = [
						expression.id,
						['$date', ['$field', controlValue]],
						expressionOpts.getValue(selectedDate)
					];
					whereFields.push(subWhere);
				} else {
					const messageField = y.messageControl.value;
					const defaultValue = y.defaultValueControl.value;
					const subWhere = [
						expression.id,
						['$field', controlValue],
						[
							'$date',
							[
								'$userparam',
								messageField,
								{ '$/tools/date': defaultValue }
							]
						]
					];

					whereFields.push(subWhere);
				}
			} else if (expressionOpts.id === 'selectField') {
				const selectField =
					y.selectField.value.id || y.selectField.value;
				const subWhere = [
					expression.id,
					['$date', ['$field', controlValue]],
					expressionOpts.getValue(selectField)
				];
				whereFields.push(subWhere);
			} else {
				const futureOrPastDaysVal =
					y.futureOrPastDaysControl.value || 0;
				const subWhere = [
					expression.id,
					['$field', controlValue],
					expressionOpts.getValue(futureOrPastDaysVal)
				];
				whereFields.push(subWhere);
			}
		} else {
			const subWhere = [expression.id, ['$field', controlValue]];
			whereFields.push(subWhere);
		}
	}

	getSetWhereForNumberField(
		expression,
		expressionOpts,
		controlValue,
		y,
		whereFields
	) {
		if (!expression.noValue) {
			if (expressionOpts.id === '__@1@__') {
				const selectField = y.selectField.value.id;
				const subWhere = [
					expression.id,
					['$field', controlValue],
					['$field', selectField]
				];
				whereFields.push(subWhere);
			} else if (expressionOpts.id === '__@2@__') {
				const selectParameter =
					y.selectParameter.value.relationName ||
					y.selectParameter.value.id;
				const subWhere = [
					expression.id,
					['$field', controlValue],
					['$sysparam', selectParameter]
				];
				whereFields.push(subWhere);
			} else {
				const messageField = y.messageControl.value;
				const defaultValue = y.defaultValueControl.value;
				const subWhere = [
					expression.id,
					['$field', controlValue],
					['$userparam', messageField, defaultValue]
				];
				whereFields.push(subWhere);
			}
		} else {
			const subWhere = [expression.id, ['$field', controlValue]];
			whereFields.push(subWhere);
		}
	}

	getSetWhereForRadioField(
		expression,
		expressionOpts,
		controlValue,
		y,
		whereFields
	) {
		if (!expression.noValue) {
			if (expressionOpts.id === '__@1@__') {
				const selectField = y.selectField.value.id;
				const subWhere = [
					expression.id,
					['$field', controlValue],
					['$field', selectField]
				];
				whereFields.push(subWhere);
			} else if (expressionOpts.id === '__@2@__') {
				const selectParameter =
					y.selectParameter.value.relationName ||
					y.selectParameter.value.id;
				const subWhere = [
					expression.id,
					['$field', controlValue],
					['$sysparam', selectParameter]
				];
				whereFields.push(subWhere);
			} else {
				const messageField = y.messageControl.value;
				const defaultValue = y.defaultValueControl.value;
				const subWhere = [
					expression.id,
					['$field', controlValue],
					['$userparam', messageField, defaultValue]
				];
				whereFields.push(subWhere);
			}
		} else {
			const subWhere = [expression.id, ['$field', controlValue]];
			whereFields.push(subWhere);
		}
	}

	getSetWhereForCheckboxField(
		expression,
		expressionOpts,
		controlValue,
		y,
		whereFields
	) {
		if (expression.id) {
			const subWhere = expression.forceValue(['$field', controlValue]);
			whereFields.push(subWhere);
		}
	}

	contructNestedChildren(children) {
		children.forEach((y, id) => {
			if (y && y.condition) {
				children[id] = {
					name: 'd' + Math.random(),
					isCondition: true,
					conditionControl: new FormControl(
						this.getConditionField(y.condition)
					),
					children: y.children,
					expression: new FormControl(),
					expressionOpts: new FormControl(),
					messageControl: new FormControl(),

					defaultValueControl: new FormControl(),
					dateAndPromptSelectorControl: new FormControl(),
					selectedDate: new FormControl(),
					futureOrPastDaysControl: new FormControl(0),
					selectField: new FormControl(),
					selectParameter: new FormControl(),
					dropdownValues: []
				};
				this.contructNestedChildren(y.children);
			} else {
				children[id] = this.constructFieldControls(y);
			}
		});
	}

	updateChildrenNested(ee, parent) {
		ee.forEach((e, id) => {
			if (e instanceof Array) {
				const first = e[0];
				if (first === '$and' || first === '$or') {
					parent.children.push({ condition: first, children: [] });

					this.updateChildrenNested(
						e.slice(1, e.length),
						parent.children[id]
					);
				} else {
					if (parent && parent.children && parent.children.length) {
						parent.children.push(e);
						this.updateChildrenNested(
							e.slice(1, e.length),
							parent.children[id]
						);
					} else {
						parent.children.push(e);
					}
				}
			}
		});
	}

	getFieldType(ty) {
		let type = null;
		let opts = null;
		Object.keys(this.expressionFieldsByType).every((y) => {
			if (!opts) {
				Object.keys(this.expressionFieldsByType[y]).every((u: any) => {
					opts = this.expressionFieldsByType[y][u].find(
						(u) => u.id === ty
					);
					if (opts) {
						type = y;
					}
				});
			}
		});
		return { opts, type };
	}

	private getConditionField(wh) {
		return this.andOrOpts.find((y) => y.id === wh);
	}

	private async getAllFields(p: FetchSignature) {
		let navData = (await this._slices.navData().toPromise()).slices;
		let rolesData = (
			await this._slices.getRoles(+this.formParams.slice.id).toPromise()
		).map((u) => u.role);
		let nav = sortBy(
			navData.filter((y) => !y.parent && y.category === 'report'),
			(u) => u.name
		);

		let userTableId = this.app.env.users;
		const blackList = [37976, userTableId];
		const rolesInfo = navData.filter(
			(y) => y.category === 'role' && !blackList.includes(y.id)
		);

		rolesData.forEach((r) => {
			const it: any = rolesInfo.find((y) => y.id === r);
			if (it) {
				it.selected = true;
			}
		});

		this.navData = new MatTableDataSource(nav);

		this.rolesData = new MatTableDataSource(rolesInfo);
		this.reportInfoMain = null;
		if (p.form) {
			const record = isNaN(p.record) ? 0 : p.record;
			this.formParams = {
				slice: p.slice,
				record,
				mode: !record
					? FORM_MODE.ADD
					: p.mode || RoutedFormComponent.defaultMode,
				form: this._forms.parseForm(p.form, p.slice)
			};

			const report = await this._slices
				.fetch(this.formParams.slice.id, {
					includeRootMeta: true
				})
				.toPromise();
			this.reportInfoMain = report;

			this.reportInfoNonParent = await this._slices
				.fetch(p.reportId, {
					includeRootMeta: true
				})
				.toPromise();

			this.setWhereConditions(
				this.reportInfoNonParent.query_params.where
			);

			// console.info('routed-form params\n\n', {slice: this.slice, record: this.record, mode: this.mode, form: this.form});
			if (!this.formParams.form) {
				this.error = FORM_ERROR_CODES.LEGACY_NEEDS_RESAVE;
				this.editAppSlice = p.slice.root?.id || p.slice.id;
				this.formParams = null;
			} else {
				this.error = null;
			}
		} else if (!this.error) {
			this._clear();
		}
		const fields: any = this.formParams.slice.meta.presentation.fields;
		const report = await this._slices.fetch(p.slice.id).toPromise();

		const outBounds = report.allRelations.outbound;
		const applicableOutboundData = [];

		outBounds['created'] = {
			fromCol: 'created',
			name: 'created',
			specialCase: true,
			type: 'control_date'
		};
		outBounds['modified'] = {
			fromCol: 'modified',
			specialCase: true,
			type: 'control_date',
			name: 'modified'
		};

		Object.keys(outBounds).forEach((t) => {
			if (
				outBounds[t].name &&
				(outBounds[t].id > 0 || outBounds[t].specialCase)
			) {
				let isRelatedSliceExistsInMeta = false;
				Object.keys(fields).forEach((ff) => {
					if (
						fields[ff].relateToSlice &&
						fields[ff].name === outBounds[t].name
					) {
						isRelatedSliceExistsInMeta = true;
					}
				});
				if (!isRelatedSliceExistsInMeta) {
					const outBoundField = {
						reportLabel: outBounds[t].fromCol,
						relateToSlice: outBounds[t].toSlice,
						id: outBounds[t].fromCol,
						fieldName: outBounds[t].fromCol,
						type: outBounds[t].type || 'control_related_dropdown'
					};
					applicableOutboundData.push(outBoundField);
				}
			}
		});

		orderBy(applicableOutboundData, (tt) => tt.reportLabel, 'asc').forEach(
			(y) => {
				fields[y.id] = y;
			}
		);

		Object.keys(this.reportInfoMain.query_params.fields).forEach((q) => {
			if (this.reportInfoMain.query_params.fields[q].$excel) {
				fields[q] = {
					type: 'customFormula',
					reportLabel: q,
					id: q,
					$excel: this.reportInfoMain.query_params.fields[q].$excel
				};
			}
		});
		fields['id'] = {
			type: 'control_number',
			reportLabel: 'id',
			id: 'id'
		};
		let reportFields = [];
		if (this.reportInfoMain) {
			reportFields = Object.keys(
				this.reportInfoMain.meta.presentation.fields
			);
		}
		let fieldsMappingData = [];
		let relatedCombo = [];
		Object.keys(fields).forEach((e, index) => {
			const f = fields[e];
			const fieldName = fields[e].reportLabel;
			const id = fields[e].id;
			let relateToSlice = null;
			let type = null;
			if (f.parent) {
				f.type = fields[f.parent].type;
			}
			switch (f.type) {
				case 'control_textarea':
					type = 'TEXTAREA';
					break;
				case 'control_fileupload':
					type = 'File';
					break;
				case 'control_new_datetime':
					type = 'DATETIME';
					break;
				case 'control_date':
					type = 'DATETIME';
					break;
				case 'control_formula_date':
					type = 'DATE';
					break;
				case 'control_formula_date_time':
					type = 'DATETIME';
					break;
				case 'control_textbox':
					type = 'TEXT';
					break;
				case 'control_dropdown':
					type = 'COMBO';
					break;
				case 'control_formula_text':
					type = 'TEXT';
					break;
				case 'control_number':
					type = 'NUMBER';
					break;

				case 'customFormula':
					type = 'customFormula';
					break;
				case 'control_formula_html':
					type = 'HTML';
					break;
				case 'control_radio':
					type = 'RADIOBUTTON';
					break;
				case 'control_related_dropdown':
					type = 'COMBO';
					relateToSlice = f.relateToSlice;
					relatedCombo.push({
						f: f,
						id: id,
						fieldName: fieldName,
						Label: fieldName + ' (' + type + ')',
						idWithType: id + ' (' + type + ')',
						relateToSlice: relateToSlice,
						e: e
					});
					break;
				case 'control_checkbox':
					type = 'CHECKBOX';
					break;
				default:
					break;
			}
			if (fieldName && type) {
				const lName =
					type === 'customFormula'
						? fieldName
						: fieldName + ' (' + type + ')';
				if (f.type !== 'control_related_dropdown') {
					if (reportFields.includes(e)) {
						fieldsMappingData.push({
							isExisting: true,
							f: f,
							id: id,
							fieldName: fieldName,
							Label: lName,
							idWithType: id + ' (' + type + ')',
							customFormula:
								type === 'customFormula' ? true : false,
							relateToSlice: relateToSlice,
							formula: f.$excel
						});
					} else {
						fieldsMappingData.push({
							f: f,
							id: id,
							fieldName: fieldName,
							Label: lName,
							idWithType: id + ' (' + type + ')',
							relateToSlice: relateToSlice,

							customFormula:
								type === 'customFormula' ? true : false,
							formula: f.$excel
						});
					}
				}
			}
		});

		// For relation Fields which are not there in fields but there in reportfields
		const fieldMappingIds = fieldsMappingData.map((ys) => ys.id);

		const relationFields = reportFields.filter(
			(y) => !fieldMappingIds.includes(y)
		);

		const relationFieldsData = [];
		relationFields.forEach((t) => {
			let ob = {};
			ob[t] = this.reportInfoMain.meta.presentation.fields[t];
			Object.assign(ob, {
				isExisting: true,
				id: t,
				relationName: t,
				Label: t
			});
			relationFieldsData.push(ob);
		});

		fieldsMappingData = orderBy(
			fieldsMappingData,
			(r) => r.fieldName.toLowerCase(),
			'asc'
		);
		fieldsMappingData = fieldsMappingData.concat(relationFieldsData);

		fieldsMappingData.forEach((a, i) => {
			a.itemIndex = i;
		});

		relatedCombo.forEach((t) => {
			if (reportFields.includes(t.e)) {
				t.isExisting = true;
			}
			fieldsMappingData.push(t);
		});
		let leftSideData = fieldsMappingData.filter((t) => !t.isExisting);

		let rightSideData = orderBy(
			fieldsMappingData.filter((t) => t.isExisting),
			(t) => t.Label.toLowerCase(),
			'asc'
		);

		this.allFields = cloneDeep(fieldsMappingData);
		this.dataSource = new MatTableDataSource(this.allFields);
		this._cd.detectChanges();
		this.loading.next(false);
	}

	ngOnDestroy() {
		this._destroyed = true;
	}

	private _load(p: FetchSignature) {
		if (p.form) {
			const record = isNaN(p.record) ? 0 : p.record;
			this.formParams = {
				slice: p.slice,
				record,
				mode: !record
					? FORM_MODE.ADD
					: p.mode || RoutedFormComponent.defaultMode,
				form: this._forms.parseForm(p.form, p.slice)
			};
			// console.info('routed-form params\n\n', {slice: this.slice, record: this.record, mode: this.mode, form: this.form});
			if (!this.formParams.form) {
				this.error = FORM_ERROR_CODES.LEGACY_NEEDS_RESAVE;
				this.editAppSlice = p.slice.root?.id || p.slice.id;
				this.formParams = null;
			} else {
				this.error = null;
			}
		} else if (!this.error) {
			this._clear();
		}

		this.loading.next(false);
	}

	insertAtCursor(textToInsert) {
		let input: HTMLTextAreaElement = this.textBlockElement.nativeElement;

		const value = this.textFormulaElement ? this.textFormulaElement : '';
		const start = input.selectionStart;
		const end = input.selectionEnd;

		const innnerText =
			value.slice(0, start) + '{' + textToInsert + '}' + value.slice(end);
		input.selectionStart = input.selectionEnd = start + textToInsert.length;
		this.textFormulaElement = innnerText;
	}
	getLevelSpace(element) {
		const offset = !element.relateToSlice && element.level !== 1 ? 8 : 0;
		if (element.level) {
			let space = 5;
			for (let index = 0; index < element.level; index++) {
				space += 10;
			}
			return space + offset + 'px';
		}
		return '0';
	}

	onExpandForRelatedDropdownForExtraField(field, index, event: Event) {
		if (field.expanded) {
			field.expanded = false;
		} else {
			field.expanded = true;
		}

		if (this.isExpandInProgress) {
			return false;
		}
		this.isExpandInProgress = true;

		if (field.expanded) {
			this._api
				.request({
					'$/tools/action_chain': [
						{
							'!/slice/report': {
								slice: this.formParams.slice.id,
								fields: { '*': '*' },
								limit: 1,
								return: { types: 1 }
							}
						},
						{
							'!/slice/permissions': {
								where: {
									id: {
										$in: [
											field.relateToSlice,
											this.formParams.slice.id
										]
									}
								}
							}
						},
						{ $_: '*' }
					]
				})
				.subscribe((r) => {
					if (r) {
						this.addRelatedColumnsForExtraField(r, index, field);
						this.isExpandInProgress = false;
					}
				});
		} else {
			field.children = [];
			this.isExpandInProgress = false;
			this._cd.detectChanges();
		}
		event.stopPropagation();
	}

	async addRelatedColumnsForExtraField(r, index, field) {
		const report = await this._slices
			.fetch(field.relateToSlice)
			.toPromise();

		const outBounds = report.allRelations.outbound;
		const applicableOutboundData = [];

		Object.keys(outBounds).forEach((t) => {
			if (outBounds[t].name) {
				const outBoundField = {
					reportLabel:
						outBounds[t].id > 1 && outBounds[t].toSlice !== 1
							? outBounds[t].fromCol
							: outBounds[t].name,
					relateToSlice: outBounds[t].toSlice,
					id: outBounds[t].name,
					fieldName: outBounds[t].name,
					type: 'control_related_dropdown'
				};
				applicableOutboundData.push(outBoundField);
			}
		});

		const sliceDetail = r[1].rows.find(
			(y) => y.id === +field.relateToSlice
		);

		// Special case of login info fields
		let fields: any = sliceDetail?.meta.presentation.fields;
		Object.keys(report.query_params.fields).forEach((q) => {
			if (report.query_params.fields[q].$excel) {
				fields[q] = {
					type: 'customFormula',
					reportLabel: q,
					id: q,
					$excel: report.query_params.fields[q].$excel
				};
			}
		});
		if (field.relateToSlice === 1) {
			fields = {};
			const loginFields = [
				{ id: 'id', type: 'control_number' },
				{ id: 'first_name', type: 'control_textbox' },
				{ id: 'last_name', type: 'control_textbox' },
				{ id: 'email', type: 'control_textbox' },
				{ id: 'login', type: 'control_textbox' },
				{ id: 'verified', type: 'control_textbox' },
				{ id: 'expire', type: 'control_textbox' },
				{ id: 'expire_password', type: 'control_textbox' },
				{ id: 'mobile_phone', type: 'control_textbox' }
			];
			loginFields.forEach((t) => {
				const loginField = {
					reportLabel: t.id,
					relateToSlice: 1,
					id: t.id,
					fieldName: t.id,
					type: t.type
				};
				fields[loginField.id] = loginField;
			});
		}

		applicableOutboundData.forEach((y) => {
			fields[y.id] = y;
		});

		let fieldsMappingData = [];
		let relatedCombo = [];
		Object.keys(fields).forEach((e, idx) => {
			const f = fields[e];
			const fieldName = fields[e].reportLabel;
			let relateToSlice = null;
			let type = null;
			const relationName =
				(field.relationName ? field.relationName : field.fieldName) +
				':' +
				f.id;
			switch (f.type) {
				case 'control_textarea':
					type = 'TEXTAREA';
					break;
				case 'control_fileupload':
					type = 'File';
					break;
				case 'control_new_datetime':
					type = 'DATETIME';
					break;

				case 'control_date':
					type = 'DATETIME';
					break;
				case 'control_formula_date':
					type = 'DATE';
					break;
				case 'control_formula_date_time':
					type = 'DATETIME';
					break;
				case 'control_textbox':
					type = 'TEXT';
					break;
				case 'control_dropdown':
					type = 'COMBO';
					break;
				case 'control_formula_text':
					type = 'TEXT';
					break;
				case 'control_number':
					type = 'NUMBER';
					break;
				case 'customFormula':
					type = 'customFormula';
					break;
				case 'control_radio':
					type = 'RADIOBUTTON';
					break;
				case 'control_related_dropdown':
					type = 'COMBO';
					relateToSlice = f.relateToSlice;
					relatedCombo.push({
						f: f,
						Label: fieldName + ' (' + type + ')',
						relateToSlice: relateToSlice,
						parentIndex: index,
						level: field.level ? field.level + 1 : 1,
						relationName: relationName,
						itemIndex: idx
					});
					break;
				case 'control_checkbox':
					type = 'CHECKBOX';
					break;
				default:
					break;
			}
			if (fieldName && type) {
				const lName =
					type === 'customFormula'
						? fieldName
						: fieldName + ' (' + type + ')';
				if (f.type !== 'control_related_dropdown') {
					fieldsMappingData.push({
						f: f,
						Label: lName,
						customFormula: type === 'customFormula' ? true : false,
						relateToSlice: relateToSlice,
						parentIndex: index,
						level: field.level ? field.level + 1 : 1,
						relationName: relationName,
						itemIndex: idx,
						formula: f.$excel
					});
				}
			}
		});

		fieldsMappingData = orderBy(
			fieldsMappingData,
			(r) => r.Label.toLowerCase(),
			'asc'
		).concat(orderBy(relatedCombo, (u) => u.relationName.toLowerCase()));

		field.children = fieldsMappingData;

		this._cd.detectChanges();
	}
	onSelectionFormulaField(field, group, trigauto: MatAutocompleteTrigger) {
		if (group.control) {
			group.control.setValue(field);
			group.controlValue.setValue(field.Label);

			group.expression.setValue(null);
			group.expressionOpts.setValue(null);
			group.messageControl.setValue(null);
			group.defaultValueControl.setValue(null);
			group.dateAndPromptSelectorControl.setValue(null);
			group.selectedDate.setValue(null);
			group.futureOrPastDaysControl.setValue(0);
			group.dropdownValues = [];
			this.onShift = false;
		}
		trigauto.closePanel();
	}

	onExpressionSelectionChange(event, group) {
		group.expression.setValue(event.value);
		group.expressionOpts.setValue(null);
	}
	onExpressionOptsSelectionChange(event, group) {
		group.expressionOpts.setValue(event.value);
		if (event.value.name === 'prompt user...') {
			this.getDropdownOptions(group);
		}
	}

	onExpressionDateOptsSelectionChange(event, group) {
		group.expressionOpts.setValue(event.value);
		group.dateAndPromptSelectorControl.setValue(
			last(this.dateAndPromptOpts)
		);
		this.onDateAndPromptSelectionChange(group);
	}

	getValue(group) {
		return group && group.control && group.control.value
			? group.control.value.Label
			: '';
	}

	displayFn(user: any): string {
		return user && user.name ? user.name : '';
	}

	onDateAndPromptSelectionChange(group) {
		const val = (group.dateAndPromptSelectorControl as FormControl).value;
		if (val === 'Prompt User') {
			group.selectedDate.disable();
			group.messageControl.enable();
			group.defaultValueControl.enable();
		} else {
			group.selectedDate.enable();
			group.messageControl.disable();
			group.defaultValueControl.disable();
		}
	}

	getDropdownOptions(group) {
		const opt: string = group.control.value.f.options;
		let optSplitted = [];
		if (opt && opt.trim()) {
			optSplitted = opt.split('|');
		}
		return this._api
			.request({
				'$/slice/report': {
					slice: this.formParams.slice.id,
					fields: [group.control.value.id],
					group: [['$field', group.control.value.id]],
					where: [
						'$nin',
						['$field', group.control.value.id],
						optSplitted
					]
				},
				$pop: 'rows'
			})
			.subscribe((y: any[]) => {
				optSplitted.forEach((yd) => {
					const obj = {};
					obj[group.control.value.id] = yd;
					y.push(obj);
				});
				y.forEach((u) => {
					u.name = u[group.control.value.id];
				});
				group.dropdownValues = orderBy(y, (u) => u.name, 'asc');
			});
	}

	getDefaultOptsByFieldMeta(group) {
		const opt: string = group.control.value.f.options;
		let optSplitted = [];
		if (opt && opt.trim()) {
			optSplitted = opt.split('|');
		}
		return optSplitted;
	}

	onKeydown(event: KeyboardEvent) {
		if (event.key === 'Shift') {
			this.onShift = !this.onShift;
		}
	}
}
