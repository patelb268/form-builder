import {
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	OnInit,
	Renderer2,
	ViewChild
} from '@angular/core';
import { FormControl } from '@angular/forms';
import {
	MatAutocomplete,
	MatAutocompleteTrigger
} from '@angular/material/autocomplete';
import { MatSelect } from '@angular/material/select';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '@services/api.service';
import { AppService } from '@services/app.service';
import { FormService } from '@services/form.service';
import { RoutingService } from '@services/routing.service';
import { SliceService } from '@services/slice.service';
import { orderBy, cloneDeep, sortBy } from 'lodash';
import { BehaviorSubject, of } from 'rxjs';
import { switchMap, catchError, takeWhile, tap, map } from 'rxjs/operators';
import {
	FormParams,
	FORM_ERROR_CODES,
	FORM_MODE
} from 'src/app/form/form.defs';
import { DlForm } from 'src/app/form/models/container';
import { RoutedFormComponent } from 'src/app/form/routed-form/routed-form.component';
import { JotMetaPresentationForm } from '../models/jot';
import { Slice } from '../models/slice';
interface FetchSignature {
	slice?: Slice;
	record?: number;
	formId?: string | number;
	form?: DlForm | JotMetaPresentationForm;
	mode?: FORM_MODE;
}
@Component({
	selector: 'app-field-selector',
	templateUrl: './field-selector.component.html',
	styleUrls: ['./field-selector.component.scss']
})
export class FieldSelectorComponent implements OnInit {
	@Input('control')
	control = new FormControl();

	fieldControl = new FormControl();

	@ViewChild('textBlockElement ', { static: false })
	textBlockElement: ElementRef;
	@ViewChild('autoc')
	autoc: MatAutocomplete;

	@ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger;

	textFormulaElement = null;
	customFormulaLabel = null;
	customFormulaOldLabel = null;
	insertField = null;
	allFields = [];

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
	reportInfo: Slice = null;
	mode = 'create';
	error?: FORM_ERROR_CODES;
	loading = new BehaviorSubject(true);

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
												record: +p.get('record'),
												formId: p.get('form'),
												form: s.getFormContainer(
													p.get('form')
												),
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
		this.reportInfo = null;
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
			this.reportInfo = report;

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

		Object.keys(this.reportInfo.query_params.fields).forEach((q) => {
			if (this.reportInfo.query_params.fields[q].$excel) {
				fields[q] = {
					type: 'customFormula',
					reportLabel: q,
					id: q,
					$excel: this.reportInfo.query_params.fields[q].$excel
				};
			}
		});
		fields['id'] = {
			type: 'control_number',
			reportLabel: 'id',
			id: 'id'
		};
		let reportFields = [];
		if (this.reportInfo) {
			reportFields = Object.keys(
				this.reportInfo.meta.presentation.fields
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
				case 'control_related_dropdown':
					type = 'COMBO';
					relateToSlice = f.relateToSlice;
					relatedCombo.push({
						f: f,
						id: id,
						fieldName: fieldName,
						Label: fieldName + ' (' + type + ')',
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
			ob[t] = this.reportInfo.meta.presentation.fields[t];
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
				if (f.type !== 'control_related_dropdown') {
					fieldsMappingData.push({
						f: f,
						Label: fieldName + ' (' + type + ')',
						relateToSlice: relateToSlice,
						parentIndex: index,
						level: field.level ? field.level + 1 : 1,
						relationName: relationName,
						itemIndex: idx
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
	onSelectionFormulaField(group) {
		this.selectedFormulaField = group;
		this.control.setValue(this.selectedFormulaField);
		this.autocomplete.closePanel();
	}

	
	displayFn(user: any): string {
		return user  ? user.id || user.relationName : '';
	}
	

	filterFileUpload(allFields) {
		if (allFields) {
			return allFields.filter(
				(y) =>
					(y.f && y.f.type === 'control_fileupload') ||
					y.relateToSlice
			);
		}
		return [];
	}
}
