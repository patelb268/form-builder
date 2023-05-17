import {
	CdkDragDrop,
	CdkDragStart,
	moveItemInArray,
	transferArrayItem
} from '@angular/cdk/drag-drop';
import {
	ChangeDetectorRef,
	Component,
	ElementRef,
	OnInit,
	Renderer2,
	ViewChild
} from '@angular/core';
import { MatSelect } from '@angular/material/select';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { ApiService } from '@services/api.service';
import { AppService } from '@services/app.service';
import { FormService } from '@services/form.service';
import { RoutingService } from '@services/routing.service';
import { SliceService } from '@services/slice.service';
import { cloneDeep, orderBy, sortBy } from 'lodash';
import { BehaviorSubject, of } from 'rxjs';
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
import Editor from 'ckeditor5-custom-build/build/ckeditor';
import { FormControl } from '@angular/forms';
import { WhereComponent } from './where/where.component';
import { SortingGroupingComponent } from './sorting-grouping/sorting-grouping.component';
import { YesOrNoComponent } from 'src/app/shared/components/grid/renderers/yes-or-no/yes-or-no.component';
import { ExportOptionsComponent } from './export-options/export-options.component';
import { RowFormattingComponent } from './row-formatting/row-formatting.component';
interface FetchSignature {
	slice?: Slice;
	record?: number;
	formId?: string | number;
	form?: DlForm | JotMetaPresentationForm;
	mode?: FORM_MODE;
}
Editor.defaultConfig = {
	height: 500,
	fontSize: {
		options: [
			7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
			25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41,
			42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54
		],
		supportAllValues: true
	},
	toolbar: {
		items: [
			'heading',
			'fontSize',
			'fontFamily',
			'fontColor',
			'fontBackgroundColor',
			'|',
			'bold',
			'italic',
			'underline',
			'highlight',
			'|',
			'link',
			'bulletedList',
			'numberedList',
			'todoList',
			'|',
			'outdent',
			'indent',
			'alignment',
			'subscript',
			'superscript',
			'strikethrough',
			'horizontalLine',
			'|',
			'imageUpload',
			'blockQuote',
			'insertTable',
			'mediaEmbed',
			'undo',
			'redo'
		]
	},
	language: 'en',
	image: {
		toolbar: [
			'imageTextAlternative',
			'imageStyle:inline',
			'imageStyle:block',
			'imageStyle:side',
			'linkImage'
		]
	},
	table: {
		contentToolbar: [
			'tableColumn',
			'tableRow',
			'mergeTableCells',
			'tableCellProperties',
			'tableProperties'
		]
	}
};

@Component({
	selector: 'app-edit-report',
	templateUrl: './edit-report.component.html',
	styleUrls: ['./edit-report.component.scss']
})
/* {
	"rowColor": [
		{
			"backgroundColor": "#fff",
			"blink": "default",
			"color": "#000",
			"fontSize": "12px",
			"fontStyle": "default",
			"fontWeight": "default",
			"rule": [
				"$and",
				[
					"$contains",
					[
						"$field",
						"CityTown"
					],
					[
						"$sysparam",
						"user:first_name"
					]
				]
			],
			"textDecoration": "default"
		},
		{
			"backgroundColor": "#fff",
			"blink": "default",
			"color": "#000",
			"fontSize": "12px",
			"fontStyle": "default",
			"fontWeight": "default",
			"rule": [
				"$and",
				[
					"$eq",
					[
						"$field",
						"id"
					],
					"1"
				]
			],
			"textDecoration": "default"
		}
	]
}*/
export class EditReportComponent implements OnInit {
	static defaultMode = FORM_MODE.VIEW;
	static legacyStaleSourceCache = new Map<number, string>();

	private _destroyed = false;
	public Editor = Editor;
	selectedFormulaField = null;
	description = '';
	showDescription = false;

	hideView = false;
	hideEdit = false;

	hideAddRelated = false;
	hideHeader = false;
	hideHeaderButtons = false;
	hideTitle = false;

	hideSummaryGrid = false;
	refreshAuto = false;
	refreshInterval = null;
	hideAddRecord = false;
	hideExport = false;
	hideSubscribe = false;
	hideDeleteData = false;
	hideOnLeftNav = false;
	hidePrint = false;

	ERRORS = FORM_ERROR_CODES;
	name = 'Untitled Report';
	applicationName:string;
	color = new FormControl('white');
	selectedColor = "black"

	colorCtrl = new FormControl();

	isBold = false;
	mode = 'create';
	parentSliceId = null;
	reportSliceId = null;
	formParams: FormParams;
	reportInfo: Slice = null;

	allFields = [];
	onShift = false;
	insertField = null;
	navData = new MatTableDataSource([]);

	rolesData = new MatTableDataSource([]);
	loading = new BehaviorSubject(true);

	error?: FORM_ERROR_CODES;
	isExpandInProgress = false;
	editAppSlice: number;

	selectionOfLeftItems: any[] = [];
	selectionOfRightItems: any[] = [];

	dragInProgressLeftItems = false;
	dragInProgressRightItems = false;
	whereFormControl = new FormControl();
	aggregateList = [
		{
			label: 'Total',
			value: 'sum'
		},
		{
			label: 'Min',
			value: 'min'
		},
		{
			label: 'Max',
			value: 'max'
		},
		{
			label: 'Avg',
			value: 'avg'
		},
		{
			label: 'Count',
			value: 'count'
		},
		{
			label: 'First',
			value: 'first'
		},
		{
			label: 'Last',
			value: 'last'
		}
	];

	@ViewChild('matSelect')
	matSelect: MatSelect;

	@ViewChild('whereRef')
	whereRef: WhereComponent;

	@ViewChild('sortGroup')
	sortGroup: SortingGroupingComponent;

	@ViewChild('exportOptions')
	exportOptions: ExportOptionsComponent;

	@ViewChild('rowFormatting')
	rowFormatting: RowFormattingComponent;

	textFormulaElement = null;
	customFormulaLabel = null;
	customFormulaOldLabel = null;
	formulaSaveUpdateBtnLabel = 'Save';

	@ViewChild('textBlockElement ', { static: false })
	textBlockElement: ElementRef;

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

	displayedColumns1: string[] = ['label'];
	displayedColumns: string[] = [
		'srNo',
		'label',
		'hidden',
		'align',
		'wrap',
		'total'
	];
	displayedColumnsReport: string[] = ['srNo'];
	ELEMENT_DATA: any[];

	dataSource = new MatTableDataSource([]);
	dataSource2 = new MatTableDataSource([]);
	removeIndexes = [];
	config = {
		expanded: {
			general: true,
			makeReports: false,
			sharing: false,
			where: true,
			columns: true,
			sortingAndGrouping: true,
			cellFormatting: true,
			rowFormatting: true,
			exportOptions: false
		}
	};

	ngOnInit() {
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
						switchMap((p) => {
							if (p.get('reportid')) {
								this.mode = 'edit';
								this.parentSliceId = p.get('sliceid');
								this.reportSliceId = p.get('reportid');
							}
							return this._slices
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
								);
						})
					)
				)
			)
			.subscribe((p) => this._load(p));
	}

	ngOnDestroy() {
		this._destroyed = true;
	}

	private async _load(p: FetchSignature) {
		let navData = (await this._slices.navData().toPromise()).slices;
		let rolesData = (
			await this._slices.getRoles(+this.reportSliceId).toPromise()
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

			if (this.mode === 'edit') {
				const report = await this._slices
					.fetch(this.reportSliceId, {
						includeRootMeta: true
					})
					.toPromise();
				this.reportInfo = report;
				this.name = this.reportInfo.name;
				this.applicationName = this.reportInfo.root.name;
				this.description =
					this.reportInfo.meta && this.reportInfo.meta.presentation
						? this.reportInfo.meta.presentation.description
						: '';

				if (this.reportInfo.meta.presentation) {
					const includeIn: any[] =
						this.reportInfo.meta.presentation.include_in;

					this.hideView = this.reportInfo.meta.presentation.hideView;
					this.hideEdit = this.reportInfo.meta.presentation.hideEdit;
					this.showDescription =
						this.reportInfo.meta.presentation.showDescription;

					this.hideAddRelated =
						this.reportInfo.meta.presentation.hideAddRelated;

					this.hideDeleteData =
						this.reportInfo.meta.presentation.hideDeleteData;
					this.hideHeader =
						this.reportInfo.meta.presentation.hideHeader;
					this.hideHeaderButtons =
						this.reportInfo.meta.presentation.hideHeaderButtons;
					this.hideTitle =
						this.reportInfo.meta.presentation.hideHeaderTitle;
					this.color = this.reportInfo.meta.presentation.titleColor;
					this.isBold = this.reportInfo.meta.presentation.titleBold;

					this.hideOnLeftNav =
						this.reportInfo.meta.presentation.hideOnLeftNav;
					this.hidePrint =
						this.reportInfo.meta.presentation.hidePrint;
					this.refreshAuto =
						this.reportInfo.meta.presentation.refreshAuto;
					this.refreshInterval =
						this.reportInfo.meta.presentation.refreshInterval;
					this.hideAddRecord =
						this.reportInfo.meta.presentation.hideAddRecord;
					this.navData.data.forEach((t) => {
						if (includeIn && includeIn.includes(t.id)) {
							t.selected = true;
						}
					});
				}
			}

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
		rightSideData.forEach((y) => {
			const dataItem = this.reportInfo.meta.presentation.fields[y.id];
			const dataItemgrid = dataItem.grid;
			y.columnOrder = dataItemgrid.columnOrder;
			y.width = dataItemgrid.width;
			y.display = dataItemgrid.display ? true : false;
			y.textAlign = dataItemgrid.textAlign;
			y.wrap = dataItemgrid.wrap;

			const aggregateValue =
				this.reportInfo.meta.presentation.grid.totals[y.id];
			y.aggregate = this.aggregateList.find(
				(es) => es.value === aggregateValue
			);
		});
		if (this.mode === 'edit') {
			rightSideData = orderBy(rightSideData, (y) => y.columnOrder, 'asc');
		}

		this.allFields = cloneDeep(fieldsMappingData);

		this.dataSource = new MatTableDataSource(leftSideData);
		this.dataSource2 = new MatTableDataSource(rightSideData);
		this._cd.detectChanges();
		this.loading.next(false);
	}

	private _clear() {
		this.formParams = null;
		this.error = null;
	}

	callApi(request: any) {
		return this._api.request<any>(request).pipe(
			take(1),
			map(
				(res) => {
					return res;
				},
				(err) => {
					console.log(err);
				}
			),
			catchError((err, caught) => {
				if (err === 'guest_restricted') {
					this._api.showLogin().subscribe();
				}
				return err;
			})
		);
	}

	async onExpandColumnForRelatedDropdown(field, index, event: Event) {
		if (this.isExpandInProgress) {
			return false;
		}
		this.isExpandInProgress = true;

		field.expanded = !field.expanded;

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
						this.addRelatedColumns(r, index, field);
						this.isExpandInProgress = false;
					}
				});
		} else {
			this.removeIndexes = [];
			this.getRemoveIndexes(index);

			const data = this.dataSource.data.filter(
				(r) => !this.removeIndexes.includes(r.itemIndex)
			);

			this.dataSource = new MatTableDataSource(data);
			this.isExpandInProgress = false;
			this._cd.detectChanges();
		}
		event.stopPropagation();
	}

	getRemoveIndexes(index) {
		this.dataSource.data
			.filter((t) => t.parentIndex === index)
			.forEach((y) => {
				this.removeIndexes.push(y.itemIndex);
				this.getRemoveIndexes(y.itemIndex);
			});
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

	async addRelatedColumns(r, index, field) {
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
				// case 'control_checkbox':
				// 	type = 'CHECKBOX';
				// 	break;

				default:
					if (f.parent) {
						const parent = fields[f.parent];
						if (parent.type === 'control_checkbox') {
							type = 'CHECKBOX';
						}
					}
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

		this.dataSource.data = [
			...this.dataSource.data.slice(0, index + 1),
			...fieldsMappingData,
			...this.dataSource.data.slice(index + 1)
		];

		this.dataSource.data.forEach((a, i) => {
			a.itemIndex = i;
		});

		this.dataSource = new MatTableDataSource(this.dataSource.data);
		this._cd.detectChanges();
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

	dropByLeft(event: CdkDragDrop<any> | any) {
		if (event.previousContainer === event.container) {
			let cIndex = event.currentIndex;
			let subStractIndex = 0;
			if (this.selectionOfRightItems.length) {
				for (
					let index = 0;
					index < this.selectionOfRightItems.length;
					index++
				) {
					let eIdx = this.selectionOfRightItems[index];
					eIdx = eIdx - subStractIndex;
					moveItemInArray(event.container.data, eIdx, cIndex);
					subStractIndex = subStractIndex + 1;
					cIndex = cIndex + 1;
				}
				this.selectionOfRightItems = [];
				this.dragInProgressRightItems = false;
			}
		} else {
			let cIndex = event.currentIndex;
			let subStractIndex = 0;
			if (this.selectionOfLeftItems.length) {
				for (
					let index = 0;
					index < this.selectionOfLeftItems.length;
					index++
				) {
					let eIdx = this.selectionOfLeftItems[index];
					eIdx = eIdx - subStractIndex;
					transferArrayItem(
						event.previousContainer.data,
						event.container.data,
						eIdx,
						cIndex
					);
					subStractIndex = subStractIndex + 1;
					cIndex = cIndex + 1;
				}
			}
		}
		this.selectionOfLeftItems = [];

		// updates moved data and table, but not dynamic if more dropzones
		this.dataSource.data = this.dataSource.data.slice();
		this.dataSource2.data = this.dataSource2.data.slice();
		this.dragInProgressLeftItems = false;
	}

	dropByRight(event: CdkDragDrop<any> | any, remove = false) {
		if (event.previousContainer === event.container) {
			this.selectionOfLeftItems = [];
			this.dragInProgressLeftItems = false;
			return;
		} else {
			let cIndex = event.currentIndex;
			let subStractIndex = 0;
			if (this.selectionOfRightItems.length) {
				for (
					let index = 0;
					index < this.selectionOfRightItems.length;
					index++
				) {
					let eIdx = this.selectionOfRightItems[index];
					eIdx = eIdx - subStractIndex;
					transferArrayItem(
						event.previousContainer.data,
						event.container.data,
						eIdx,
						cIndex
					);
					subStractIndex = subStractIndex + 1;
					cIndex = cIndex + 1;
				}
				// autoArrancee By Index
				event.container.data = orderBy(
					event.container.data,
					(t) => t.itemIndex,
					'asc'
				);
			}
		}
		this.selectionOfRightItems = [];

		// updates moved data and table, but not dynamic if more dropzones
		this.dataSource = new MatTableDataSource(event.container.data);
		this.dataSource2.data = this.dataSource2.data.slice();
		this.dragInProgressRightItems = false;
	}

	dragStartToLeft(event: CdkDragStart, index, row) {
		if (!this.selectionOfRightItems.length) {
			let indexSelected = index;
			const existIdx = this.selectionOfRightItems.indexOf(indexSelected);
			if (existIdx >= 0) {
				this.selectionOfRightItems.splice(existIdx, 1);
			} else {
				this.selectionOfRightItems.push(indexSelected);
			}
		}
		const totalItems = this.selectionOfRightItems.length;
		if (totalItems) {
			const preview = new ElementRef<HTMLElement>(
				document.querySelector('.cdk-drag.cdk-drag-preview')
			);
			let html = `<div class="d-flex justify-content-center flex-column bg-white">
						<div class="p-1 text-center bg-danger text-white">${totalItems}</div>`;

			this.selectionOfRightItems.forEach((t) => {
				const itm = this.dataSource2.data[t];
				html =
					html +
					`<div class="p-1 px-2 border-default-gray-bottom ft-normal"> ${itm.Label} </div>`;
			});
			html = html + '</div>';
			preview.nativeElement.innerHTML = html;
			this.renderer.addClass(
				preview.nativeElement,
				'preview-min-content'
			);
			//replace 'move' with what ever type of cursor you want
			this.dragInProgressRightItems = true;
		}
	}

	dragStartToRight(event: CdkDragStart, index, row) {
		if (!this.selectionOfLeftItems.length) {
			let indexSelected = index;
			const existIdx = this.selectionOfLeftItems.indexOf(indexSelected);
			if (existIdx >= 0) {
				this.selectionOfLeftItems.splice(existIdx, 1);
			} else {
				this.selectionOfLeftItems.push(indexSelected);
			}
		}
		const totalItems = this.selectionOfLeftItems.length;

		if (totalItems) {
			const preview = new ElementRef<HTMLElement>(
				document.querySelector('.cdk-drag.cdk-drag-preview')
			);
			let html = `<div class="d-flex justify-content-center flex-column bg-white ">
						<div class="p-1 text-center bg-success text-white">${totalItems}</div>`;

			this.selectionOfLeftItems.forEach((t) => {
				const itm = this.dataSource.data[t];
				html =
					html +
					`<div class="p-1 px-2 border-default-gray-bottom ft-normal"> ${itm.Label} </div>`;
			});
			html = html + '</div>';
			preview.nativeElement.innerHTML = html;
			this.renderer.addClass(
				preview.nativeElement,
				'preview-min-content'
			);
			//replace 'move' with what ever type of cursor you want
			this.dragInProgressLeftItems = true;
		}
	}

	saveReport() {
		if (this.reportSliceId) {
			this.updateReport();
		} else {
			this.createReport();
		}
	}

	getSortGroupFields() {
		const fieldValues = [];
		this.sortGroup.sortIterations.forEach((y) => {
			const field = y.fieldCtrl.value.id;
			const order = y.orderCtrl.value;

			fieldValues.push([order, ['$field', field]]);
		});
		return fieldValues;
	}

	getQueryParamWhereFields() {
		if (
			this.whereRef.whereIterations.length &&
			this.whereRef.whereIterations.some(
				(t) => t.control && t.control.value
			)
		) {
			const whereFields = [];
			const mainCondition = this.whereRef.mainCondition;
			whereFields.push(mainCondition.id);
			this.whereRef.whereIterations.forEach((y) => {
				if (y.isCondition) {
					const controlValue = y.conditionControl.value.id;
					const subWhere = [controlValue];
					if (y.children) {
						this.getSetToNestedWhere(y.children, subWhere);
					}
					whereFields.push(subWhere);
				} else {
					if (y.control.value) {
						const expression = y.expression.value;
						const controlValue = y.control.value.id;
						const expressionOpts = y.expressionOpts.value;

						switch (y.control.value.f.type) {
							case 'control_formula_html':
							case 'customFormula':
							case 'control_textarea':
							case 'control_textbox':
							case 'control_formula_text':
								this.getSetWhereForTextField(
									expression,
									expressionOpts,
									controlValue,
									y,
									whereFields
								);
								break;

							case 'control_date':
							case 'control_new_datetime':
							case 'control_formula_date':
							case 'control_formula_date_time':
								this.getSetWhereForDateField(
									expression,
									expressionOpts,
									controlValue,
									y,
									whereFields
								);
								break;

							case 'control_number':
								this.getSetWhereForNumberField(
									expression,
									expressionOpts,
									controlValue,
									y,
									whereFields
								);
								break;
							case 'control_radio':
								this.getSetWhereForRadioField(
									expression,
									expressionOpts,
									controlValue,
									y,
									whereFields
								);
								break;

							case 'control_checkbox':
								this.getSetWhereForCheckboxField(
									expression,
									expressionOpts,
									controlValue,
									y,
									whereFields
								);
								break;

							default:
								break;
						}

						if (y.children) {
							const subWhere = [];
							this.getSetToNestedWhere(y.children, subWhere);
							if (subWhere.length) {
								whereFields.push(subWhere);
							}
						}
					}
				}
			});
			return whereFields;
		} else {
			return [];
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

	getSetToNestedWhere(node: any[], subWhere: any[]) {
		node.forEach((y) => {
			if (y.isCondition) {
				const controlValue = y.conditionControl.value.id;
				const s = [controlValue];
				if (y.children) {
					this.getSetToNestedWhere(y.children, s);
				}
				subWhere.push(s);
			} else {
				const expression = y.expression.value;
				const controlValue = y.control.value.id;
				const expressionOpts = y.expressionOpts.value;

				switch (y.control.value.f.type) {
					case 'control_formula_html':
					case 'customFormula':
					case 'control_textarea':
					case 'control_textbox':
					case 'control_formula_text':
						this.getSetWhereForTextField(
							expression,
							expressionOpts,
							controlValue,
							y,
							subWhere
						);
						break;

					case 'control_date':
					case 'control_new_datetime':
					case 'control_formula_date':
					case 'control_formula_date_time':
						this.getSetWhereForDateField(
							expression,
							expressionOpts,
							controlValue,
							y,
							subWhere
						);
						break;

					case 'control_number':
						this.getSetWhereForNumberField(
							expression,
							expressionOpts,
							controlValue,
							y,
							subWhere
						);
						break;
					case 'control_radio':
						this.getSetWhereForRadioField(
							expression,
							expressionOpts,
							controlValue,
							y,
							subWhere
						);
						break;

					case 'control_checkbox':
						this.getSetWhereForCheckboxField(
							expression,
							expressionOpts,
							controlValue,
							y,
							subWhere
						);
						break;

					default:
						break;
				}
				if (y.children) {
					const s = [];
					this.getSetToNestedWhere(y.children, s);

					if (s.length) {
						subWhere.push(s);
					}
				}
			}
		});
	}

	getRowFormattingFields() {
		const fieldsValues = [];
		this.rowFormatting.rowFormatting.forEach((element, index) => {
			fieldsValues.push({
				backgroundColor: element.backgroundColorCtrl.value,
				blink: element.animationCtrl.value,
				color: element.textColorCtrl.value,
				fontSize: element.fontSizeCtrl.value,
				fontStyle: element.fontStyleCtrl.value,
				fontWeight: element.fontWeightCtrl.value,
				textDecoration: element.textDecorationCtrl.value,
				rule: this.getQueryParamRowFormattingFields(index)
			});
		});
		return fieldsValues;
	}

	getQueryParamRowFormattingFields(index) {
		const rowFormattingFields = [];
		const mainCondition =
			this.rowFormatting.rowFormatting[index].mainCondition;
		rowFormattingFields.push(mainCondition.id);
		this.rowFormatting.rowFormatting[index].whereIterations.forEach((y) => {
			if (y.isCondition) {
				const controlValue = y.conditionControl.value.id;
				const subRowFormatting = [controlValue];
				if (y.children) {
					this.getSetToNestedRowFormatting(
						y.children,
						subRowFormatting
					);
				}
				rowFormattingFields.push(subRowFormatting);
			} else {
				if (y.control.value) {
					const expression = y.expression.value;
					const controlValue = y.control.value.id;
					const expressionOpts = y.expressionOpts.value;

					switch (y.control.value.f.type) {
						case 'control_formula_html':
						case 'customFormula':
						case 'control_textarea':
						case 'control_textbox':
						case 'control_formula_text':
							this.getSetRowFormattingForTextField(
								expression,
								expressionOpts,
								controlValue,
								y,
								rowFormattingFields
							);
							break;

						case 'control_date':
						case 'control_new_datetime':
						case 'control_formula_date':
						case 'control_formula_date_time':
							this.getSetRowFormattingForDateField(
								expression,
								expressionOpts,
								controlValue,
								y,
								rowFormattingFields
							);
							break;

						case 'control_number':
							this.getSetRowFormattingForNumberField(
								expression,
								expressionOpts,
								controlValue,
								y,
								rowFormattingFields
							);
							break;
						case 'control_radio':
							this.getSetRowFormattingForRadioField(
								expression,
								expressionOpts,
								controlValue,
								y,
								rowFormattingFields
							);
							break;

						case 'control_checkbox':
							this.getSetRowFormattingForCheckboxField(
								expression,
								expressionOpts,
								controlValue,
								y,
								rowFormattingFields
							);
							break;

						default:
							break;
					}

					if (y.children) {
						const subRowFormatting = [];
						this.getSetToNestedRowFormatting(
							y.children,
							subRowFormatting
						);
						if (subRowFormatting.length) {
							rowFormattingFields.push(subRowFormatting);
						}
					}
				}
			}
		});
		return rowFormattingFields;
	}

	getSetRowFormattingForTextField(
		expression,
		expressionOpts,
		controlValue,
		y,
		rowFormattingFields
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
				rowFormattingFields.push(subWhere);
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
				rowFormattingFields.push(subWhere);
			} else if (expressionOpts.id === '__@3@__') {
				const messageField = y.messageControl.value;
				const defaultValue = y.defaultValueControl.value;
				const subWhere = [
					expression.id,
					['$field', controlValue],
					['$userparam', messageField, defaultValue]
				];
				rowFormattingFields.push(subWhere);
			} else {
				const subWhere = [
					expression.id,
					['$field', controlValue],
					expressionOpts
				];
				rowFormattingFields.push(subWhere);
			}
		} else {
			const subWhere = [expression.id, ['$field', controlValue]];
			rowFormattingFields.push(subWhere);
		}
	}

	getSetRowFormattingForDateField(
		expression,
		expressionOpts,
		controlValue,
		y,
		rowFormattingFields
	) {
		if (!expression.noValue) {
			if (expressionOpts.id === 'select') {
				if (y.dateAndPromptSelectorControl.value === 'Pick a Date') {
					const selectedDate = y.selectedDate.value;
					const subRowFormatting = [
						expression.id,
						['$date', ['$field', controlValue]],
						expressionOpts.getValue(selectedDate)
					];
					rowFormattingFields.push(subRowFormatting);
				} else {
					const messageField = y.messageControl.value;
					const defaultValue = y.defaultValueControl.value;
					const subRowFormatting = [
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

					rowFormattingFields.push(subRowFormatting);
				}
			} else if (expressionOpts.id === 'selectField') {
				const selectField =
					y.selectField.value.id || y.selectField.value;
				const subRowFormatting = [
					expression.id,
					['$date', ['$field', controlValue]],
					expressionOpts.getValue(selectField)
				];
				rowFormattingFields.push(subRowFormatting);
			} else {
				const futureOrPastDaysVal =
					y.futureOrPastDaysControl.value || 0;
				const subRowFormatting = [
					expression.id,
					['$field', controlValue],
					expressionOpts.getValue(futureOrPastDaysVal)
				];
				rowFormattingFields.push(subRowFormatting);
			}
		} else {
			const subRowFormatting = [expression.id, ['$field', controlValue]];
			rowFormattingFields.push(subRowFormatting);
		}
	}

	getSetRowFormattingForNumberField(
		expression,
		expressionOpts,
		controlValue,
		y,
		rowFormattingFields
	) {
		if (!expression.noValue) {
			if (expressionOpts.id === '__@1@__') {
				const selectField = y.selectField.value.id;
				const subRowFormatting = [
					expression.id,
					['$field', controlValue],
					['$field', selectField]
				];
				rowFormattingFields.push(subRowFormatting);
			} else if (expressionOpts.id === '__@2@__') {
				const selectParameter =
					y.selectParameter.value.relationName ||
					y.selectParameter.value.id;
				const subRowFormatting = [
					expression.id,
					['$field', controlValue],
					['$sysparam', selectParameter]
				];
				rowFormattingFields.push(subRowFormatting);
			} else {
				const messageField = y.messageControl.value;
				const defaultValue = y.defaultValueControl.value;
				const subRowFormatting = [
					expression.id,
					['$field', controlValue],
					['$userparam', messageField, defaultValue]
				];
				rowFormattingFields.push(subRowFormatting);
			}
		} else {
			const subRowFormatting = [expression.id, ['$field', controlValue]];
			rowFormattingFields.push(subRowFormatting);
		}
	}

	getSetRowFormattingForRadioField(
		expression,
		expressionOpts,
		controlValue,
		y,
		rowFormattingFields
	) {
		if (!expression.noValue) {
			if (expressionOpts.id === '__@1@__') {
				const selectField = y.selectField.value.id;
				const subRowFormatting = [
					expression.id,
					['$field', controlValue],
					['$field', selectField]
				];
				rowFormattingFields.push(subRowFormatting);
			} else if (expressionOpts.id === '__@2@__') {
				const selectParameter =
					y.selectParameter.value.relationName ||
					y.selectParameter.value.id;
				const subRowFormatting = [
					expression.id,
					['$field', controlValue],
					['$sysparam', selectParameter]
				];
				rowFormattingFields.push(subRowFormatting);
			} else {
				const messageField = y.messageControl.value;
				const defaultValue = y.defaultValueControl.value;
				const subRowFormatting = [
					expression.id,
					['$field', controlValue],
					['$userparam', messageField, defaultValue]
				];
				rowFormattingFields.push(subRowFormatting);
			}
		} else {
			const subRowFormatting = [expression.id, ['$field', controlValue]];
			rowFormattingFields.push(subRowFormatting);
		}
	}

	getSetRowFormattingForCheckboxField(
		expression,
		expressionOpts,
		controlValue,
		y,
		rowFormattingFields
	) {
		if (expression.id) {
			const subRowFormatting = expression.forceValue([
				'$field',
				controlValue
			]);
			rowFormattingFields.push(subRowFormatting);
		}
	}

	getSetToNestedRowFormatting(node: any[], subRowFormatting: any[]) {
		node.forEach((y) => {
			if (y.isCondition) {
				const controlValue = y.conditionControl.value.id;
				const s = [controlValue];
				if (y.children) {
					this.getSetToNestedRowFormatting(y.children, s);
				}
				subRowFormatting.push(s);
			} else {
				const expression = y.expression.value;
				const controlValue = y.control.value.id;
				const expressionOpts = y.expressionOpts.value;

				switch (y.control.value.f.type) {
					case 'control_formula_html':
					case 'customFormula':
					case 'control_textarea':
					case 'control_textbox':
					case 'control_formula_text':
						this.getSetRowFormattingForTextField(
							expression,
							expressionOpts,
							controlValue,
							y,
							subRowFormatting
						);
						break;

					case 'control_date':
					case 'control_new_datetime':
					case 'control_formula_date':
					case 'control_formula_date_time':
						this.getSetRowFormattingForDateField(
							expression,
							expressionOpts,
							controlValue,
							y,
							subRowFormatting
						);
						break;

					case 'control_number':
						this.getSetRowFormattingForNumberField(
							expression,
							expressionOpts,
							controlValue,
							y,
							subRowFormatting
						);
						break;
					case 'control_radio':
						this.getSetRowFormattingForRadioField(
							expression,
							expressionOpts,
							controlValue,
							y,
							subRowFormatting
						);
						break;

					case 'control_checkbox':
						this.getSetRowFormattingForCheckboxField(
							expression,
							expressionOpts,
							controlValue,
							y,
							subRowFormatting
						);
						break;

					default:
						break;
				}
				if (y.children) {
					const s = [];
					this.getSetToNestedRowFormatting(y.children, s);

					if (s.length) {
						subRowFormatting.push(s);
					}
				}
			}
		});
	}

	updateReport() {
		let includeIn = this.navData.data.filter((t) => t.selected);
		if (includeIn.length) {
			includeIn = includeIn.map((t) => t.id);
		} else {
			includeIn = [];
		}

		const fields = {};
		const queryParamFields = { fields: {} };
		const queryParamWhereFields = this.getQueryParamWhereFields();
		const sortGroupFields = this.getSortGroupFields();
		const rowFormattingColor = this.getRowFormattingFields();

		this.dataSource2.data.forEach((ee, index) => {
			const labelName = ee.relationName ? ee.relationName : ee.f.id;

			fields[labelName] = {
				grid: {
					columnOrder: index,
					width: ee.width ? ee.width : 40,
					display: ee.display ? 'none' : undefined,
					textAlign: ee.textAlign ? ee.textAlign : undefined,
					wrap: ee.wrap ? ee.wrap : undefined
				}
			};

			if (ee.customFormula) {
				queryParamFields.fields[labelName] = { $excel: ee.formula };
			} else {
				queryParamFields.fields[labelName] = ee.relationName
					? ee.relationName
					: ee.f.id;
			}
		});

		const aggregateFields = {};
		this.dataSource2.data
			.filter((t) => t.aggregate)
			.forEach((w, i) => {
				aggregateFields[w.f.id] = w.aggregate;
			});

		const delta_perms = [];
		this.rolesData.data.forEach((element) => {
			if (element.selected) {
				delta_perms.push({
					role: element.id,
					grant: 32
				});
			} else {
				delta_perms.push({
					role: element.id,
					revoke: 32
				});
			}
		});

		const reportDetail = {
			id: this.reportSliceId,
			name: this.name,
			category: 'report',
			parent: this.reportInfo.parent,
			query_params: {
				fields: queryParamFields.fields,
				group: [],
				order: sortGroupFields,
				where: queryParamWhereFields
			},
			delta_perms: delta_perms,
			meta: {
				presentation: {
					reportType: 'grid',
					description: this.description,
					hideView: this.hideView,
					hideEdit: this.hideEdit,
					hideAddRelated: this.hideAddRelated,
					hideDeleteData: this.hideDeleteData,
					hideHeader: this.hideHeader,
					hideHeaderButtons: this.hideHeaderButtons,
					hideHeaderTitle: this.hideTitle,
					showDescription: this.showDescription,
					hidePrint: this.hidePrint,

					hideAddRecord: this.hideAddRecord,
					hideOnLeftNav: this.hideOnLeftNav,
					refreshAuto: this.refreshAuto,
					refreshInterval: this.refreshInterval,
					summaryGrid: 0,
					include_in: includeIn,
					gantt: {
						startDateField: '',
						endDateField: '',
						clockFormat: 'L:NN A',
						yAxis: '',
						label: '',
						periodValue: 1,
						startValue: 0
					},
					calendar: {
						startTimeAttr: '',
						allDay: 0,
						endTimeAttr: '',
						summaryAttr: '',
						showLabelTime: 0,
						firstDayOfWeek: 0,
						dateInterval: 'month',
						onRowClick: 'view',
						onRowClickNewTab: 0,
						onEmptyRowClick: 'none',
						colorBackfill: 0
					},
					chart: {
						subtitle: '',
						expression: ''
					},
					pie: {
						subtitle: '',
						subtitleIncludeTotal: 0,
						decimalPlaces: 0,
						outer: {
							label: '',
							showPercent: 0,
							showCount: 0,
							showTotal: 0
						},
						tooltip: {
							label: '',
							showPercent: 0,
							showCount: 0,
							showTotal: 0
						}
					},
					graph: {
						header: {
							title: '',
							xSummary: '',
							ySummary: '',
							summaryExpr: '',
							count: 0
						},
						type: 'bar',
						x: '',
						xAggregate: 'none',
						y: '',
						yAggregate: 'none',
						yCurrency: 0,
						yPrecision: 0,
						angle: '0',
						depth: 0,
						randomizeFill: 0
					},
					zoneMap: {
						keyField: '',
						rotate: null,
						expression: '',
						onHoverAction: 'none',
						hoverTemplate: '12161240742|testv1',
						css: '',
						html: '',
						ratioX: null,
						ratioY: null
					},
					map: {
						refreshrate: 60,
						clearmarkers: 1,
						center: '',
						autoFitMarkers: 0,
						zoom: 13,
						latfield: '',
						longfield: '',
						addressfield: '',
						showDirections: 0,
						optimizeRoute: 0
					},
					pivot: {
						column: '',
						key: '',
						cell: ''
					},
					fields: fields,
					grid: {
						totals: aggregateFields,
						cellColor: [],
						rowColor: rowFormattingColor,
						order: null
					},
					export: {
						fileName: this.exportOptions.fileName,
						delimiter: this.exportOptions.delimiter,
						dateFormat: this.exportOptions.dateFormat,
						timeFormat: this.exportOptions.timeFormat,
						dateTimeFormat: this.exportOptions.dateTimeFormat,
						enclosure: this.exportOptions.wrapvalues,
						firstRowLabels: this.exportOptions.fieldLabelNamesCheck
							? 1
							: 0,
						removeSpecialsCharacters: this.exportOptions
							.removeSpCharactersCheck
							? 1
							: 0,
						prettyRelations: this.exportOptions.displayRelCheck
							? 1
							: 0,
						includeRawWithPrettys: this.exportOptions
							.includeRawRelcheck
							? 1
							: 0
					},
					titleColor: this.color,
					titleBold: this.isBold
				}
			}
		};
		const request = {
			'$/tools/action_chain': [
				{
					'!/slice/modify': {
						slice: reportDetail
					}
				}
			]
		};

		this._api.request(request).subscribe((e: any) => {
			if (e) {
				this.app.refreshNav.next();
				this._slices.refreshCache();
				this.router.navigate([this._routing.reportView(e.slice.id)]);
			}
		});
	}
	createReport() {
		let includeIn = this.navData.data.filter((t) => t.selected);
		if (includeIn.length) {
			includeIn = includeIn.map((t) => t.id);
		} else {
			includeIn = [];
		}
		const fields = {};
		const queryParamFields = {};
		const aggregateFields = {};
		this.dataSource2.data.forEach((ee, index) => {
			fields[ee.f.id] = {
				grid: {
					columnOrder: index,
					width: 40,
					display: ee.display ? 'none' : undefined,
					textAlign: ee.textAlign ? ee.textAlign : undefined,
					wrap: ee.wrap ? ee.wrap : undefined
				}
			};
			queryParamFields[ee.f.id] = ee.f.id;
		});

		const request = {
			'$/tools/action_chain': [
				{
					'!/slice/inherit': {
						id: this.reportSliceId ? this.reportSliceId : undefined,
						parent: this.formParams.slice.id,
						meta: {
							presentation: {
								reportType: 'grid',
								description: this.description,
								hideView: this.hideView,
								hideEdit: this.hideView,
								hideAddRelated: this.hideAddRelated,
								hideHeader: this.hideHeader,
								hideHeaderButtons: this.hideHeaderButtons,
								hideHeaderTitle: this.hideTitle,
								showDescription: this.showDescription,
								hideDeleteData: this.hideDeleteData,
								hideOnLeftNav: this.hideOnLeftNav,
								hideAddRecord: this.hideAddRecord,
								hidePrint: this.hidePrint,
								refreshInterval: this.refreshInterval,
								refreshAuto: this.refreshAuto,
								summaryGrid: 0,
								include_in: includeIn,
								gantt: {
									startDateField: '',
									endDateField: '',
									clockFormat: 'L:NN A',
									yAxis: '',
									label: '',
									periodValue: 1,
									startValue: 0
								},
								calendar: {
									startTimeAttr: '',
									allDay: 0,
									endTimeAttr: '',
									summaryAttr: '',
									showLabelTime: 0,
									firstDayOfWeek: 0,
									dateInterval: 'month',
									onRowClick: 'view',
									onRowClickNewTab: 0,
									onEmptyRowClick: 'none',
									colorBackfill: 0
								},
								chart: {
									subtitle: '',
									expression: ''
								},
								pie: {
									subtitle: '',
									subtitleIncludeTotal: 0,
									decimalPlaces: 0,
									outer: {
										label: '',
										showPercent: 0,
										showCount: 0,
										showTotal: 0
									},
									tooltip: {
										label: '',
										showPercent: 0,
										showCount: 0,
										showTotal: 0
									}
								},
								graph: {
									header: {
										title: '',
										xSummary: '',
										ySummary: '',
										summaryExpr: '',
										count: 0
									},
									type: 'bar',
									x: '',
									xAggregate: 'none',
									y: '',
									yAggregate: 'none',
									yCurrency: 0,
									yPrecision: 0,
									angle: '0',
									depth: 0,
									randomizeFill: 0
								},
								zoneMap: {
									keyField: '',
									rotate: null,
									expression: '',
									onHoverAction: 'none',
									hoverTemplate: '12161240742|testv1',
									css: '',
									html: '',
									ratioX: null,
									ratioY: null
								},
								map: {
									refreshrate: 60,
									clearmarkers: 1,
									center: '',
									autoFitMarkers: 0,
									zoom: 13,
									latfield: '',
									longfield: '',
									addressfield: '',
									showDirections: 0,
									optimizeRoute: 0
								},
								pivot: {
									column: '',
									key: '',
									cell: ''
								},
								fields: fields,
								grid: {
									totals: aggregateFields,
									cellColor: [],
									rowColor: []
								},
								export: {
									fileName: '',
									delimiter: ',',
									dateFormat: '%Y-%m-%d',
									timeFormat: '%k:%i:%s',
									dateTimeFormat: '%Y-%m-%d %k:%i:%s',
									enclosure: '"',
									firstRowLabels: 1,
									removeSpecialsCharacters: 0,
									prettyRelations: 1,
									includeRawWithPrettys: 0
								},
								titleBold: this.isBold,
								titleColor: this.color
							}
						},
						name: this.name,
						category: 'report',
						query_params: {
							where: [],
							fields: queryParamFields,
							order: [],
							group: []
						}
					}
				}
			]
		};

		this._api.request(request).subscribe((e: any) => {
			if (e) {
				this.app.refreshNav.next();
				this._slices.refreshCache();
				this.router.navigate([this._routing.reportView(e.id)]);
			}
		});
	}

	saveCustomFormula() {
		const fields = {};
		fields['id'] = 'id';
		fields[this.customFormulaLabel] = { $excel: this.textFormulaElement };

		this._api
			.request({
				'$/slice/report': {
					slice: this.formParams.slice.id,
					fields: fields,
					limit: 1,
					return: { types: 1 }
				}
			})
			.subscribe((y: any) => {
				if (y && y.types) {
					const containsField = y.types[this.customFormulaLabel];
					if (containsField) {
						if (this.formulaSaveUpdateBtnLabel === 'Update') {
							let fieldToUpdateIdx =
								this.dataSource2.data.findIndex(
									(y) =>
										y.f &&
										y.f.id === this.customFormulaOldLabel
								);
							if (fieldToUpdateIdx > -1) {
								this.dataSource2.data[fieldToUpdateIdx] = {
									f: { id: this.customFormulaLabel },
									customFormula: true,
									Label: this.customFormulaLabel,
									relateToSlice: 0,
									parentIndex: 0,
									formula: this.textFormulaElement,
									relationName: this.customFormulaLabel
								};
								this.dataSource2._updateChangeSubscription();
							}
						} else {
							this.dataSource2.data.unshift({
								f: { id: this.customFormulaLabel },
								customFormula: true,
								Label: this.customFormulaLabel,
								relateToSlice: 0,
								parentIndex: 0,
								formula: this.textFormulaElement,
								relationName: this.customFormulaLabel
							});
							this.dataSource2._updateChangeSubscription();
						}
						this.customFormulaLabel = null;
						this.customFormulaOldLabel = null;
						this.textFormulaElement = null;

						this.formulaSaveUpdateBtnLabel = 'Save';
						this._cd.detectChanges();
					} else {
						this.app.notify.warn('failed, bad expression');
					}
				}
			});
	}

	doubleClick(row) {
		this.formulaSaveUpdateBtnLabel = 'Update';
		if (row.customFormula) {
			this.customFormulaLabel = row.Label;
			this.textFormulaElement = row.formula;
			this.customFormulaOldLabel = row.Label;
		}
	}

	selectLeft(event: MouseEvent, index, row: any, dataSource) {
		let indexSelected = index; // row index

		// always find the
		if (event.ctrlKey) {
			const existIdx = this.selectionOfLeftItems.indexOf(indexSelected);
			if (existIdx >= 0) {
				this.selectionOfLeftItems.splice(existIdx, 1);
			} else {
				this.selectionOfLeftItems.push(indexSelected);
			}
		} else if (event.shiftKey) {
			if (this.selectionOfLeftItems.length) {
				let rowFrom =
					this.selectionOfLeftItems[0] % dataSource.data.length;
				let rowTo = indexSelected % dataSource.data.length;
				if (rowFrom > rowTo) [rowFrom, rowTo] = [rowTo, rowFrom];
				this.selectionOfLeftItems = [];
				for (let index = 0; index < dataSource.data.length; index++) {
					const row = index % dataSource.data.length;
					if (row >= rowFrom && row <= rowTo) {
						this.selectionOfLeftItems.push(index);
					}
				}
			} else this.selectionOfLeftItems = [indexSelected];
		} else {
			const existIdx = this.selectionOfLeftItems.indexOf(indexSelected);
			if (existIdx >= 0) {
				this.selectionOfLeftItems = [];
			} else {
				this.selectionOfLeftItems = [];
				this.selectionOfLeftItems.push(indexSelected);
			}
		}
	}

	onSelectionFormulaField(group) {
		this.selectedFormulaField = group;
		this.matSelect.close();
		this.insertField = [];
		this.insertAtCursor(
			group.relationName || this.selectedFormulaField.f.id
		);
		// Temp patch
		document
			.getElementsByClassName('mat-select-panel')[0]
			.querySelectorAll('.mat-selected')
			.forEach((el) => {
				el.classList.remove('mat-selected');
			});
	}

	selectRight(event: MouseEvent, index, row: any, dataSource) {
		let indexSelected = index; // row index

		// always find the
		if (event.ctrlKey) {
			const existIdx = this.selectionOfRightItems.indexOf(indexSelected);
			if (existIdx >= 0) {
				this.selectionOfRightItems.splice(existIdx, 1);
			} else {
				this.selectionOfRightItems.push(indexSelected);
			}
		} else if (event.shiftKey) {
			if (this.selectionOfRightItems.length) {
				let rowFrom =
					this.selectionOfRightItems[0] % dataSource.data.length;
				let rowTo = indexSelected % dataSource.data.length;
				if (rowFrom > rowTo) [rowFrom, rowTo] = [rowTo, rowFrom];
				this.selectionOfRightItems = [];
				for (let index = 0; index < dataSource.data.length; index++) {
					const row = index % dataSource.data.length;
					if (row >= rowFrom && row <= rowTo) {
						this.selectionOfRightItems.push(index);
					}
				}
			} else this.selectionOfRightItems = [indexSelected];
		} else {
			const existIdx = this.selectionOfRightItems.indexOf(indexSelected);
			if (existIdx >= 0) {
				this.selectionOfRightItems = [];
			} else {
				this.selectionOfRightItems = [];
				this.selectionOfRightItems.push(indexSelected);
			}
		}
	}

	moveToRight() {
		if (this.selectionOfLeftItems.length) {
			this.dropByLeft({
				previousContainer: this.dataSource,
				container: this.dataSource2,
				currentIndex: this.dataSource2.data.length
			});
		}
	}

	moveToLeft() {
		if (this.selectionOfRightItems.length) {
			this.dropByRight(
				{
					previousContainer: this.dataSource2,
					container: this.dataSource,
					currentIndex: this.dataSource.data.length
				},
				true
			);
		}
	}

	isSelected(rowIndex, selectionItems) {
		return selectionItems.indexOf(rowIndex) >= 0;
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

	onKeydown(event: KeyboardEvent) {
		if (event.key === 'Shift') {
			this.onShift = !this.onShift;
		}
	}
}
