import {
	ChangeDetectorRef,
	Component,
	OnDestroy,
	OnInit,
	ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '@services/api.service';
import { AppService } from '@services/app.service';
import { FormService } from '@services/form.service';
import { SliceService } from '@services/slice.service';
import { cloneDeep, head, orderBy, sortBy } from 'lodash';
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
	FORM_MODE,
	FORM_ERROR_CODES,
	FormParams
} from 'src/app/form/form.defs';
import { DlForm } from 'src/app/form/models/container';
import { RoutedFormComponent } from 'src/app/form/routed-form/routed-form.component';
import { JotMetaPresentationForm } from 'src/app/shared/models/jot';
import { Slice } from 'src/app/shared/models/slice';

import { MatTableDataSource } from '@angular/material/table';
import { CKEditorComponent } from '@ckeditor/ckeditor5-angular';
import Editor from 'ckeditor5-custom-build/build/ckeditor';
import { MatSelect } from '@angular/material/select';
import { FormulaFieldSelectorComponent } from '../formula-field-selector/formula-field-selector.component';
import { NotifyService } from '@services/notify.service';
import { _ } from 'ag-grid-community';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { FormControl } from '@angular/forms';
interface FetchSignature {
	slice?: Slice;
	record?: number;
	formId?: string | number;
	form?: DlForm | JotMetaPresentationForm;
	mode?: FORM_MODE;
}

Editor.defaultConfig = {
	fullPage: true,
	toolbar: {
		items: [
			'heading',
			'|',
			'fontFamily',
			'fontSize',
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
			'horizontalLine',
			'|',
			'findAndReplace',
			'specialCharacters',
			'imageInsert',
			'blockQuote',
			'insertTable',
			'mediaEmbed',
			'undo',
			'redo',
			'|',
			'sourceEditing'
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
	selector: 'app-detail',
	templateUrl: './detail.component.html',
	styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit, OnDestroy {
	private _destroyed = false;
	selectedTab = null;
	showSettings = false;
	loading = new BehaviorSubject(true);
	error?: FORM_ERROR_CODES;
	formParams: FormParams;
	pdfPreview = null;
	tabButtons = ['Editor', 'Source Editor', 'PDF Preview', 'Settings'];
	editAppSlice: number;

	editorData = '';

	saveField = null;
	serverTextFormula = null;

	navData = new MatTableDataSource([]);
	rolesData = new MatTableDataSource([]);
	reportInfo: Slice = null;
	allFields = [];
	isExpandInProgress = false;
	displayedColumns1: string[] = ['label'];
	removeIndexes = [];
	dataSource = new MatTableDataSource([]);
	public Editor = Editor;

	templateName = null;
	selectedFormulaField = null;
	insertField = null;
	searchField = new FormControl();

	mode = 'edit';
	@ViewChild('editor ', { static: false })
	ckEditor: CKEditorComponent;

	@ViewChild('matSelect')
	matSelect: MatSelect;

	
	@ViewChild('autoc')
	autoc: MatAutocomplete;

	@ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger;

	@ViewChild('appFormula')
	appFormula: FormulaFieldSelectorComponent;

	id = null;
	constructor(
		public app: AppService,
		private _slices: SliceService,
		private _route: ActivatedRoute,
		private _cd: ChangeDetectorRef,
		private _forms: FormService,
		private _api: ApiService,
		private notify: NotifyService,
		private router: Router
	) {}

	ngOnInit() {
		this.selectedTab = head(this.tabButtons);
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
							this.id = p.get('id');
							return this._slices
								.fetch(p.get('slice'), {
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
			.subscribe((p) => {
				this._load(p);
				this.getAllFields(p);
				setTimeout(() => {
					this.ckEditor.editorInstance.title = false;	
				}, 100);
				
			});
	}

	private _load(p: FetchSignature) {
		if(this.id){
			this._slices.fetch(this.id).subscribe((y)=>{
				
				this.templateName = y.name;
				this.editorData = (y.meta as any).template?.content || '';
				this.serverTextFormula = (y.meta as any).template?.saveNameExpr;
				
				this.saveField = (y.meta as any).template?.saveField;
			});
		}
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

	private _clear() {}

	createTemplate() {
		if (!this.templateName) {
			this.notify.warn('Missing template name');
			return;
		}
		if (this.id) {
			this._api
				.request({
					'$/tools/action_chain': [
						{
							'!/slice/modify': {
								slice: {
									name:
										this.templateName ||
										'Untitled Template',
									category: 'template',
									meta: {
										template: {
											content: this.editorData,
											saveField: this.selectedFormulaField
												? this.selectedFormulaField
														.relationName ||
												  this.selectedFormulaField.f.id
												: undefined,
											saveNameExpr:
												this.appFormula &&
												this.appFormula
													.textFormulaElement
													? this.appFormula
															.textFormulaElement
													: undefined
										}
									},
									id: this.id
								}
							}
						},
						{
							'!/slice/permissions': {
								where: ['$in', ['$field', 'id'], [this.id]]
							}
						},
						{
							'!/tools/column': {
								col: 'id',
								rows: { $_: '1:rows' }
							}
						},
						{
							'!/slice/relations': {
								slices: { $_: '2' },
								ignorePermsCheck: true
							}
						},
						{ $_: '*' }
					]
				})
				.subscribe((y) => {
					if (y) {
						this.notify.success(
							'Your template updated succesfully!'
						);
					} else {
						this.notify.warn('Error in saving template');
					}
					this._cd.detectChanges();
				});
		} else {
			this._api
				.request({
					'$/tools/action_chain': [
						{
							'!/slice/inherit': {
								name: this.templateName || 'Untitled Template',
								category: 'template',
								meta: {
									template: {
										content: this.editorData,
										saveField: this.selectedFormulaField
											? this.selectedFormulaField
													.relationName ||
											  this.selectedFormulaField.f.id
											: undefined,
										saveNameExpr:
											this.appFormula &&
											this.appFormula.textFormulaElement
												? this.appFormula
														.textFormulaElement
												: undefined
									}
								},
								parent: this.formParams.slice.id
							}
						},
						{
							'!/slice/permissions': {
								where: { id: { $_: '0:id' } }
							}
						},
						{
							'!/tools/column': {
								col: 'id',
								rows: { $_: '1:rows' }
							}
						},
						{
							'!/slice/relations': {
								slices: { $_: '2' },
								ignorePermsCheck: true
							}
						},
						{ $_: '*' }
					]
				})
				.subscribe((y: any[]) => {
					if (y) {
						this.notify.success(
							'Your template was created succesfully!'
						);
						this.id = head(y).id;
					} else {
						this.notify.warn('Error in saving template');
					}
					this._cd.detectChanges();
				});
		}
	}

	goBack() {
		this.router.navigate(['templates/' + this.formParams.slice.id]);
	}

	deleteTemplate() {
		this._api
			.request({ rem: { '$/slice/destroy': { slice: this.id } } })
			.subscribe((y) => {
				this.notify.success('Template Removed!');
				this.router.navigate(['templates/' + this.formParams.slice.id]);
			});
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
	ngOnDestroy() {
		this._destroyed = true;
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

	onSelectionFormulaField(group, isInsert = false) {
		this.selectedFormulaField = group;
		this.matSelect ? this.matSelect.close(): '';
		this.autocomplete ? this.autocomplete.closePanel(): '';

		this.searchField.setValue(group.relationName || this.selectedFormulaField.f.id);
		
		if (isInsert) {
			this.insertField = null;
			this.insertAtCursor(
				group.relationName || this.selectedFormulaField.f.id
			);
			
		} else {
			this.insertField = group;
		}
		setTimeout(() => {
			var mm = document.querySelector('.sp-case .mat-select-min-line');
			if (mm) {
				mm.innerHTML = group.relationName || group.Label;
				mm.classList.remove('mat-select-placeholder');
			}
		}, 100);

		// document
		// 	.getElementsByClassName('mat-select-panel')[0]
		// 	.querySelectorAll('.mat-selected')
		// 	.forEach((el) => {
		// 		el.classList.remove('mat-selected');
		// 	});
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

	insertAtCursor(textToInsert) {
		const viewFragment = this.ckEditor.editorInstance.data.processor.toView(
			'{' + textToInsert + '}'
		);
		const modelFragment =
			this.ckEditor.editorInstance.data.toModel(viewFragment);
		this.ckEditor.editorInstance.model.insertContent(modelFragment);
	}

	action(t) {
		this.showSettings = false;

		if (this.selectedTab === t) {
			return;
		}
		this.selectedTab = t;
		const elements = document.getElementsByClassName(
			'ck-source-editing-button'
		);
		switch (this.selectedTab) {
			case 'Source Editor':
				if (elements && head(elements)) {
					const element = head(elements);
					if (element.classList.contains('ck-off')) {
						(head(elements) as any).click();
					}
				}
				break;
			case 'Editor':
				if (elements && head(elements)) {
					const element = head(elements);
					if (element.classList.contains('ck-on')) {
						(head(elements) as any).click();
					}
				}
				break;
			case 'PDF Preview':
				this.getPDFData();
			default:
				this.showSettings = true;
				setTimeout(() => {
					this.appFormula.textFormulaElement = this.serverTextFormula;
					
					this.searchField.setValue(this.saveField);
				}, 100);
				break;
		}
	}

	getPDFData() {
		this.pdfPreview = ' ';
		this._api
			.request({
				'$/tools/action_chain': [
					{
						'!/slice/utils/template_replace': {
							template: `<!DOCTYPE html><html><head><title>PDF Preview</title></head><body> ${this.editorData} </body></html>`,
							row: {}
						}
					},
					{
						'!/slice/utils/html_to_pdf': {
							name: 'undefined_pdf_preview',
							return: 'base64',
							html: {
								$_: '0:html'
							}
						}
					},
					{
						$_: '*'
					}
				]
			})
			.subscribe((y) => {
				this.pdfPreview = 'data:application/pdf;base64,' + y[1].encoded;
				this._cd.detectChanges();
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
}
