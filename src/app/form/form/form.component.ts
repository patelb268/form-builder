import { Location } from '@angular/common';

import {
	AfterViewInit,
	ChangeDetectorRef,
	Component,
	ComponentFactoryResolver,
	Input,
	OnDestroy,
	OnInit,
	TemplateRef,
	ViewChild,
	ViewContainerRef
} from '@angular/core';
import {
	AbstractControl,
	AsyncValidatorFn,
	FormControl,
	FormGroup,
	ValidatorFn,
	Validators
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatFormField } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '@services/api.service';
import { AppService } from '@services/app.service';
import { RoutingService } from '@services/routing.service';
import { SliceService } from '@services/slice.service';
import { StorageService } from '@services/storage.service';
import { cloneDeep, forEach, groupBy, head, last, map as _map } from 'lodash';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import {
	catchError,
	distinctUntilChanged,
	filter,
	map,
	switchMap,
	take
} from 'rxjs/operators';
import { JotMetaPresentation } from 'src/app/shared/models/jot';
import { Slice } from 'src/app/shared/models/slice';
import { TranslatePipe } from 'src/app/shared/pipes/translate.pipe';
import { AlphabeticStrictValidator } from 'src/app/shared/validators/alphabeticStrict.validator';
import { AlphanumericStrictValidator } from 'src/app/shared/validators/alphanumericStrict.validator';
import { DecimalPlacesValidator } from 'src/app/shared/validators/decimalPlaces.validator';
import { IsNumericValidator } from 'src/app/shared/validators/isNumeric.validator';
import { LimitToListValidator } from 'src/app/shared/validators/limitToList.validator';
import { PhoneNumberValidator } from 'src/app/shared/validators/phoneNumber.validator';
import { TelExtensionValidator } from 'src/app/shared/validators/telExtension.validator';
import { PreviewComponent } from 'src/app/templates/preview/preview.component';
import { ControlFileComponent } from '../controls/control-file/control-file.component';
import { FormParams, FORM_MODE } from '../form.defs';
import { Conditions, DlContainers, DlForm } from '../models/container';
import { DlFormControl, DlHasLimitToListValidator } from '../models/control';

export function patchMatFormField() {
	const patchedFormFieldClass = MatFormField.prototype as any;

	patchedFormFieldClass.updateOutlineGapOriginal =
		MatFormField.prototype.updateOutlineGap;
	MatFormField.prototype.updateOutlineGap = function () {
		this.updateOutlineGapOriginal();
		const container = this._connectionContainerRef.nativeElement;
		const gapEls = container.querySelectorAll(
			'.mat-form-field-outline-gap'
		);
		gapEls.forEach((gp) => {
			const calculatedGapWidth = +gp.style.width.replace('px', '');
			const gapWidth = calculatedGapWidth / 0.75;
			gp.style.width = `${gapWidth}px`;
		});
	};
}
const containers = new Set(['div', 'html', 'collapse', 'controlWrap']),
	controls = new Set([
		'textbox',
		'numberbox',
		'dropdown',
		'relatedDropdown',
		'checkbox',
		'file'
	]);
patchMatFormField();
@Component({
	selector: 'form-form',
	templateUrl: './form.component.html',
	styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit, OnDestroy, AfterViewInit {
	datasource = null;
	_onAddGridInitEdit = null;
	fileExt = null;
	errorList = null;

	fileName = null;
	fileControlName = null;
	showToolbar = false;
	pdfs = [];
	pks = [];
	showAll = false;
	selectedIndex = 0;
	promptSet = new Set<string>();
	relations = {};

	valueChanges: Subscription = null;

	@ViewChild('fileRef')
	fileRef: ControlFileComponent;

	@ViewChild('errorRef')
	errorRef: TemplateRef<any>;

	@ViewChild('formField') formField: MatFormField;

	_params = null;
	allControlsWithLabel = [];

	images = [];
	@Input() set params(p: FormParams) {
		const existing = !!this.form;
		this.mode = p.mode;
		this.record = p.record;
		this.slice = p.slice;

		if (this.slice.root.meta.presentation) {
			for (const pKey of Object.keys(
				this.slice.root.meta.presentation.fields as object
			)) {
				for (const key of Object.keys(
					this.slice.allRelations.inbound as object
				)) {
					const inboundData = this.slice.allRelations.inbound[key];
					if (
						inboundData.name ===
						this.slice.root.meta.presentation.fields[pKey]
							.selectRelation
					) {
						var customWidth =
							this.slice.root.meta.presentation.fields[pKey]
								.useWidth &&
							this.slice.root.meta.presentation.fields[pKey]
								.useWidth === 'Yes'
								? +this.slice.root.meta.presentation.fields[
										pKey
								  ].width
								: false;
						this.relations[
							this.slice.root.meta.presentation.fields[pKey].id
						] = {
							slice: parseInt(
								this.slice.root.meta.presentation.fields[pKey]
									.embedGrid
							),
							left: inboundData.fromCol,
							right: inboundData.toCol,
							grid: false,
							related: true,
							customWidth: customWidth
						};
						const d =
							this.relations[
								this.slice.root.meta.presentation.fields[pKey]
									.id
							];
						let qry = {};
						if (d.hasOwnProperty('left')) {
							qry = ['$eq', ['$field', d.left], this.record];
						}
						d.qry = qry;
					}
				}
			}

			if (p.form !== this.form && existing) {
				this._destroyForm();
				this._cd.detectChanges();
			}
			this.form = p.form;
			if (existing) {
				this._buildFormGroup(this.form);
			}
			this._params = p;
		}
	}

	containerClass = containers;
	controlClass = controls;
	form: DlForm;
	clonedForm: any = [];
	referenceId = null;
	refUrl = null;
	formGroup: FormGroup;
	parentData = null;
	mode: FORM_MODE;
	FORM_MODE = FORM_MODE;
	record: number;
	slice: Slice;
	hideFormulaHTMLInitial = true;

	private _formControls = new Map<string, FormControl>();
	private _controlDefs = new Map<string, DlFormControl>();
	historyControls = [];

	constructor(
		private _cd: ChangeDetectorRef,
		private _api: ApiService,
		private app: AppService,
		private _slices: SliceService,
		private _routing: RoutingService,
		private router: Router,
		private storageService: StorageService,
		private location: Location,
		public snakbar: MatSnackBar,
		private activatedRoute: ActivatedRoute,
		private matDialog: MatDialog
	) {}

	ngOnDestroy() {
		this._destroyForm();
	}

	resetFile() {
		this.fileRef.removeFiles();
	}

	showFile(r) {
		if (r && r.id) {
			return (
				this.formGroup &&
				this.formGroup.controls[r.id] &&
				this.formGroup.controls[r.id]['show'] != false
			);
		}
		return true;
	}

	check(r) {
		console.log(r);
	}
	ngOnInit() {
		const st: any = this.location.getState();

		this.referenceId = st && st.data ? st.data.id : undefined;
		this.refUrl = st && st.data ? st.data.refUrl : undefined;
		this.parentData = st && st.data ? st.data.parentItem : undefined;
		this._buildFormGroup(this.form);

		this.clonedForm = cloneDeep(this.form);

		if (this.form && this.form.children) {
			this.form.children = this.form.children.filter(
				(e) => e.inTabControl !== 'Yes' || !e.inTabControl
			);
		}

		if (this.clonedForm.children) {
			const isAdmin = this.app.getCurrentAuth().sysadmin;
			if (isAdmin) {
				this.clonedForm = _map(
					groupBy(
						// this.clonedForm.children.filter((r) => !r.hidden),
						this.clonedForm.children,
						(y) => y.inTabControl
					),
					(t: any) => {
						return {
							data: t,
							tab: t && t[0].inTabControl === 'Yes' ? true : false
						};
					}
				).filter((r) => r.tab);
			} else {
				this.clonedForm = _map(
					groupBy(
						this.clonedForm.children.filter((r) => !r.hidden),
						(y) => y.inTabControl
					),
					(t: any) => {
						return {
							data: t,
							tab: t && t[0].inTabControl === 'Yes' ? true : false
						};
					}
				).filter((r) => r.tab);
			}
		}

		if (this.form && this.form.children && this.clonedForm) {
			this.form.children = this.form.children.concat(this.clonedForm);
		}
		this.getAllRecordsPks();
		this.loadData();
	}

	ngAfterViewInit(): void {
		this.showToolbar = true;
	}

	getAllRecordsPks() {
		this.callApi({
			'$/slice/report': {
				slice: this.form.slice,
				fields: {
					id: 'id'
				},

				order: [['$asc', ['$field', 'id']]]
			},
			$pop: 'rows'
		}).subscribe((e: any) => {
			if (e && e.length) {
				this.pks = e.map((t) => t.id);
			}
		});
	}

	private _destroyForm() {
		this._formControls.clear();
		this._controlDefs.clear();
		this.form = null;
		this.formGroup = null;
	}

	private _buildFormGroup(f: DlForm) {
		this.formGroup = new FormGroup({});

		this._recursiveAddControls(f.children || []);
	}

	private _recursiveAddControls(children: (DlContainers | DlFormControl)[]) {
		(children || []).forEach((child) => {
			if ('children' in child) {
				this._recursiveAddControls(child.children);
			} else {
				this._addControl(child as DlFormControl);
			}
		});
	}

	dataURLtoFile(dataurl, filename) {
		var arr = dataurl.split(','),
			mime = arr[0].match(/:(.*?);/)[1],
			bstr = atob(arr[1]),
			n = bstr.length,
			u8arr = new Uint8Array(n);

		while (n--) {
			u8arr[n] = bstr.charCodeAt(n);
		}

		return new File([u8arr], filename, { type: mime });
	}

	onSave(onlySave = false, saveAndNext = false, saveAndBack = false) {
		const mode = cloneDeep(this.mode);
		this.mode = FORM_MODE.SAVE;
		
		this.mode = mode;
		if (this.formGroup.invalid) {
			this.promptSet.clear();

			const errorMsgList: any[] = [];

			Object.keys(this.formGroup.controls).forEach((e) => {
				if (this.formGroup.controls[e].errors?.['required']) {
					const c = this.allControlsWithLabel.find((t) => t.id === e);
					if (c) errorMsgList.push('• ' + c.label);
				}
			});

			this.errorList =
				'Below Fields are required. <br>' + errorMsgList.join('<br>');

			return this.snakbar.openFromTemplate(this.errorRef, {
				panelClass: ['bg-white'],
				duration: 50000
			});
		} else {
			const data = this.formGroup.getRawValue();

			const actions = [];
			const test = [];

			const fileName = +new Date();
			let fileData = null;
			if (this.images.length) {
				fileData = this.dataURLtoFile(
					this.images[0].src,
					fileName + '.' + this.fileExt
				);
			}

			if (this.pdfs.length) {
				fileData = this.dataURLtoFile(
					this.pdfs[0].src,
					fileName + '.pdf'
				);
			}

			if (this.mode === FORM_MODE.EDIT) {
				data.id = this.record;
				if (fileData) {
					this._api
						.upload([fileData], {
							field: this.fileControlName,
							record: this.record,
							slice: this.slice.id
						})
						.subscribe((r: any) => {
							if (r && r.files && r.files.length) {
								data[this.fileControlName] =
									'[' + r.files[0].id + ']';
								this.update(
									data,
									onlySave,
									saveAndNext,
									saveAndBack
								);
							}
						});
				} else {
					this.update(data, onlySave, saveAndNext, saveAndBack);
				}
			} else {
				if (fileData) {
					this._api
						.uploadAndInsertRow(
							[fileData],
							data,
							this.slice.id,
							this.fileControlName
						)
						.subscribe((r: any) => {
							if (r && r.keys && r.keys.length) {
								this.app.notify.success('record_added');
								this.performPostSaveAction(
									head(r.keys),
									onlySave,
									saveAndNext,
									saveAndBack
								);
							}
						});
				} else {
					this.insert(data, onlySave, saveAndNext, saveAndBack);
				}
			}
		}
	}

	private update(
		data,
		onlySave = false,
		saveAndNext = false,
		saveAndBack = false
	) {
		this._api
			.request({
				'$/slice/xupdate': {
					slice: this.slice.id,
					rows: [data]
				},
				$pop: 'keys'
			})
			.subscribe((r: number[]) => {
				if (r && r.length) {
					this.app.notify.success('record_updated');
					this.performPostSaveAction(
						head(r),
						onlySave,
						saveAndNext,
						saveAndBack
					);
				}
			});
	}

	onEditClick() {
	
		let url = this.router
			.createUrlTree([
				this._routing.formEditRecord(
					this.slice.id,
					this.slice.defaultFormId,
					this.record
				)
			])
			.toString();

		this.location.go(url);
		this.mode = FORM_MODE.EDIT;
		this.checkFormValidations();
	}

	test(def) {
		console.log(def);
	}

	onViewClick() {
		let url = this.router
			.createUrlTree([
				this._routing.formViewRecord(
					this.slice.id,
					this.slice.defaultFormId,
					this.record
				)
			])
			.toString();

		this.location.go(url);
		this.mode = FORM_MODE.VIEW;
		this.valueChanges.unsubscribe();
		this.loadData();
		this.checkFormValidations();
	}

	onTabChanged(event: MatTabChangeEvent) {
		this.selectedIndex = event.index;
		this.storageService.set('form-tab-index', this.selectedIndex);
	}

	onDuplicateClick() {
		let url = this.router
			.createUrlTree([
				this._routing.formAddRecord(
					this.slice.id,
					this.slice.defaultFormId
				)
			])
			.toString();

		this.location.go(url);
		this.mode = FORM_MODE.ADD;
	}

	private insert(
		data,
		onlySave = false,
		saveAndNext = false,
		saveAndBack = false
	) {
		this._api
			.request({
				'$/slice/xinsert': {
					slice: this.slice.id,
					rows: [data]
				},
				$pop: 'keys'
			})
			.subscribe((r: number[]) => {
				if (r && r.length) {
					this.record = head(r);
					this.app.notify.success('record_added');

					this.performPostSaveAction(
						head(r),
						onlySave,
						saveAndNext,
						saveAndBack
					);
				}
			});
	}

	performPostSaveAction(
		key,
		onlySave = false,
		saveAndNext = false,
		saveAndBack = false
	) {
		this.checkFormValidations();
		if (onlySave) {
			let url = this.router
				.createUrlTree([
					this._routing.formViewRecord(
						this.slice.id,
						this.slice.defaultFormId,
						key
					)
				])
				.toString();

			this.location.go(url);
			this.mode = FORM_MODE.VIEW;
			this._cd.detectChanges();
		} else if (saveAndNext) {
			if (this.mode === FORM_MODE.EDIT) {
				const idx = this.pks.findIndex((t) => t === this.record);

				if (idx < this.pks.length - 1) {
					const moveToIdx = this.pks[idx + 1];

					let url = this.router
						.createUrlTree([
							this._routing.formEditRecord(
								this.slice.id,
								this.slice.defaultFormId,
								moveToIdx
							)
						])
						.toString();

					this.location.go(url);
					this.mode = FORM_MODE.EDIT;
					this.record = moveToIdx;
					this.valueChanges.unsubscribe();
					this.loadData();
				} else {
					this.app.notify.success('record_updated');
					setTimeout(() => {
						this.app.notify.inform(
							'You are at the end of the set, returning to listing screen'
						);
						this.router.navigate([
							this._routing.reportView(this.slice.id)
						]);
					}, 1000);
				}
			} else {
				let url = this.router
					.createUrlTree([
						this._routing.formAddRecord(
							this.slice.id,
							this.slice.defaultFormId
						)
					])
					.toString();

				this.location.go(url);
				this.mode = FORM_MODE.ADD;
				this.formGroup.reset();
				this.images = [];
				this.pdfs = [];
				this.record = null;
			}
		} else {
			if (this.refUrl) {
				this.router.navigate([this.refUrl]);
			} else {
				const returnUrl =
					this.activatedRoute.snapshot.queryParams.returnURL;
				if (returnUrl) {
					this.router.navigate([returnUrl]);
				} else {
					this.router.navigate([
						this._routing.reportView(this.slice.id)
					]);
				}
			}
		}
	}

	refresh() {
		this.loadData();
	}

	loadData() {
		if (this.mode !== FORM_MODE.ADD) {
			this.callApi({
				'$/slice/report': {
					slice: this.slice.parent || this.slice.id,
					fields: {
						'*': '*'
					},
					where: ['$and', ['$eq', ['$field', 'id'], this.record]]
				},
				$pop: 'rows'
			}).subscribe((e: any) => {
				if (e && e.length) {
					const data = e[0];

					Object.keys(data).forEach((w) => {
						if (this.formGroup.controls[w]) {
							try {
								this.formGroup.controls[w].patchValue(data[w]);
							} catch (e) {
								console.log(e);
							}
						}
					});
				}
				this.subscribeValueChanges();

				this.historyControls.forEach((yy) => {
					this.setHistoryData(yy.id, yy.controlInfo);
				});

				setTimeout(() => {
					this.showAll = true;
					this.checkFormValidations();
					this._cd.detectChanges();
				}, 10);
			});
		} else {
			const dup = cloneDeep(this.app.duplicateContent);
			if (dup) {
				this.formGroup.patchValue(dup);
				this.app.duplicateContent = null;
			}
			this.subscribeValueChanges();

			setTimeout(() => {
				this.showAll = true;
				this.checkFormValidations();
				this._cd.detectChanges();
			}, 10);
			if (this.parentData) {
				this.formGroup.patchValue(this.parentData);
			}
		}
	}

	setHistoryData(controlId, controlInfo) {
		this._api
			.request({
				'$/slice/history': {
					slice: this.slice.id,
					fields: [controlInfo.fields],
					pkey: this.record
				}
			})
			.subscribe((y) => {
				if (y) {
					const data: any[] = y[controlInfo.fields];
					let value = '';
					if (data) {
						data.forEach((u) => {
							let i = '[';

							if (controlInfo.showDate === 'Yes') {
								i = i.concat(
									moment(u.modified).format(
										controlInfo.dateFormat
									)
								);
							}

							if (controlInfo.showTime === 'Yes') {
								i = i.concat(
									moment(u.modified).format(
										', HH:mm A '
									)
								);
							}

							if (controlInfo.showAuthor === 'Yes') {
								i = i.concat(u.user);
							}
							i = i.concat('] ' + u.value + '\n');
							value = value.concat(i);
						});
					}
					this.formGroup.controls[controlId].setValue(value, {
						onlySelf: false,
						emitEvent: false
					});
				}
			});
	}

	subscribeValueChanges() {
		this.valueChanges = this.formGroup.valueChanges
			.pipe(
				distinctUntilChanged(
					(a, b) => JSON.stringify(a) === JSON.stringify(b)
				)
			)
			.subscribe((e) => {
				this.checkFormValidations();
				const field = {};
				const formulaField = [];
				Object.keys(this.formGroup.controls).forEach((c) => {
					if (
						(
							(this.slice.root?.meta || this.slice.meta)
								.presentation as JotMetaPresentation
						).fields[c] &&
						(
							(this.slice.root?.meta || this.slice.meta)
								.presentation as JotMetaPresentation
						).fields[c].Formula
					) {
						if (
							this.slice.root?.meta.presentation.fields[c].type ==
							'control_formula_html'
						) {
							const r = /({[^}]+}*)/g;
							const a: any = (
								(this.slice.root?.meta || this.slice.meta)
									.presentation as JotMetaPresentation
							).fields[c].Formula.split(r);
							a.forEach((y: any, index) => {
								if (y.indexOf('{') > -1) {
									a[index] = [
										'$field',
										y.replace(/[{}]/g, '')
									];
								}
							});
							field[c] = ['$concat_ws', '', ...a];
						} else {
							field[c] = {
								$excel: (
									(this.slice.root?.meta || this.slice.meta)
										.presentation as JotMetaPresentation
								).fields[c].Formula
							};
						}
						formulaField.push(c);
					} else {
						field[c] = this.formGroup.controls[c].value;
					}
				});

				const req = {
					'$/slice/preview': {
						slice: this.slice.id,
						fields: {
							id: this.record,
							...field
						},
						$pop: 'rows'
					}
				};

				this.callApi(req).subscribe((r) => {
					if (r && r.rows && r.rows.length) {
						formulaField.forEach((ew) => {
							this.formGroup.get(ew).setValue(head(r.rows)[ew], {
								onlySelf: false,
								emitEvent: false
							});
						});
					}
					this.hideFormulaHTMLInitial = false;
					this.historyControls.forEach((yy) => {
						this.setHistoryData(yy.id, yy.controlInfo);
					});
				});
			});

		this.selectedIndex = +this.storageService.get('form-tab-index');
	}

	checkFormValidations() {
		const validations = [];
		this.valueChanges.unsubscribe();
		if (this.form.conditions) {
			Object.keys(this.formGroup.controls).forEach((ct: any) => {
				if (ct) {
					this.form.conditions.forEach((c: Conditions) => {
						c.action.forEach((a) => {
							const field = a.field;
							const visibility = a.visibility;
							const prompt = a.prompt;
							const terms = c.terms;
							const link = c.link;
							let isValid = false;
							if (field) {
								if (ct === field) {
									switch (visibility) {
										case 'Show':
											isValid = this.termCheck(
												terms,
												link
											);
											if (isValid) {
												this.formGroup.controls[ct][
													'show'
												] = true;
											} else {
												this.formGroup.controls[ct][
													'show'
												] = false;
											}
											break;
										case 'Hide':
											isValid = this.termCheck(
												terms,
												link
											);
											if (isValid) {
												this.formGroup.controls[ct][
													'show'
												] = false;
											} else {
												this.formGroup.controls[ct][
													'show'
												] = true;
											}
											break;

										case 'make_required':
											isValid = this.termCheck(
												terms,
												link
											);
											const hasValidator =
												hasRequiredField(
													this.formGroup.controls[ct]
												);

											if (isValid) {
												this.formGroup.controls[
													ct
												].setValidators([
													Validators.required
												]);
												this.formGroup.controls[
													ct
												].updateValueAndValidity();
											} else {
												this.formGroup.controls[
													ct
												].clearValidators();
												this.formGroup.controls[
													ct
												].updateValueAndValidity();
											}

											break;
										case 'disable':
											isValid = this.termCheck(
												terms,
												link
											);
											if (this.mode !== FORM_MODE.VIEW) {
												if (isValid) {
													this.formGroup.controls[ct][
														'readonly'
													] = true;
													this.formGroup.controls[
														ct
													].setValue(null);
												} else {
													this.formGroup.controls[ct][
														'readonly'
													] = false;
												}
											}
											break;
										case 'enable':
											isValid = this.termCheck(
												terms,
												link
											);
											if (this.mode !== FORM_MODE.VIEW) {
												if (isValid) {
													this.formGroup.controls[ct][
														'readonly'
													] = false;
												} else {
													this.formGroup.controls[ct][
														'readonly'
													] = true;
													this.formGroup.controls[
														ct
													].setValue(null);
												}
											}
											break;

										default:
											break;
									}
								}
							} else if (prompt) {
								isValid = this.termCheck(terms, link);
								if (isValid) {
									if (!this.promptSet.has(prompt)) {
										this.app.notify.inform(prompt);
									}

									this.promptSet.add(prompt);
								}
							}
						});
					});
				}
			});
		}
		this.subscribeValueChanges();
	}

	termCheck(terms: any[], link: string) {
		const conditionsInfo = [];
		terms.forEach((w) => {
			const isValid = this.checkOperatorCondition(
				w.field,
				w.operator,
				w.value
			);
			conditionsInfo.push(isValid);
		});

		if (link === 'All') {
			return conditionsInfo.every((r) => !!r);
		} else {
			return conditionsInfo.some((r) => !!r);
		}
	}

	checkOperatorCondition(field, operator, value) {
		let isValid = false;
		let currentFieldValue = null;
		if (field) {
			currentFieldValue = this.formGroup.controls[field]?.value;
		} else {
			currentFieldValue = this.mode;
		}
		switch (operator) {
			case 'isFilled':
				isValid = currentFieldValue ? true : false;
				break;
			case 'lessThan':
				if (+currentFieldValue < +value) {
					isValid = true;
				}
				break;
			case 'greaterThan':
				if (+currentFieldValue > +value) {
					isValid = true;
				}
				break;
			case 'equals':
				if (currentFieldValue == value) {
					isValid = true;
				}
				break;
			case 'notEquals':
				if (currentFieldValue != value) {
					isValid = true;
				}
				break;
			case 'contains':
				if (
					currentFieldValue &&
					currentFieldValue.indexOf('' + value) > -1
				) {
					isValid = true;
				}
				break;
			case 'notContains':
				if (
					currentFieldValue &&
					currentFieldValue.indexOf('' + value) == -1
				) {
					isValid = true;
				}
				break;
			case 'isEmpty':
				if (!currentFieldValue) {
					isValid = true;
				}
				break;
			case 'endsWith':
				if (
					currentFieldValue &&
					currentFieldValue.endsWith('' + value)
				) {
					isValid = true;
				}
				break;
			case 'before':
				if (
					currentFieldValue &&
					new Date(currentFieldValue) < new Date(value)
				) {
					isValid = true;
				}
				break;
			case 'after':
				if (
					currentFieldValue &&
					new Date(currentFieldValue) > new Date(value)
				) {
					isValid = true;
				}
				break;
			// case "greaterThan":
			// 	if (currentFieldValue && +currentFieldValue > +value) {
			// 		isValid = true;
			// 	}
			// 	break;
			// case "lessThan":
			// 	if (currentFieldValue && +currentFieldValue < +value) {
			// 		isValid = true;
			// 	}
			// 	break;

			default:
				break;
		}

		return isValid;
	}

	onDeleteClick() {
		const trans = TranslatePipe.instance;

		this.app
			.confirm({
				message: trans.transform('delete_conf')
			})
			.pipe(
				filter((yes) => !!yes),
				switchMap(() =>
					this._api.request({
						'$/slice/xdelete': {
							slice: this.slice.id,
							pkeys: [this.record]
						}
					})
				)
			)
			.subscribe((resp) => {
				if (resp) {
					this.app.notify.success(trans.transform('delete_success'));

					this.router.navigate([
						this._routing.reportView(this.slice.id)
					]);

					// this._allSlices.next(this._allSlices.getValue().filter(x => x.id !== slice.id));
				} else {
					this.app.notify.warn(
						trans.transform('error_deleting_x', { x: this.record })
					);
				}
			});
	}

	goToFirst() {
		const idx = this.pks.findIndex((t) => t === this.record);

		if (idx > 0) {
			const moveToIdx = head(this.pks);

			let url = this.router
				.createUrlTree([
					this._routing.formViewRecord(
						this.slice.id,
						this.slice.defaultFormId,
						moveToIdx
					)
				])
				.toString();

			this.location.go(url);
			this.mode = FORM_MODE.VIEW;
			this.record = moveToIdx;
			this.valueChanges.unsubscribe();
			this.loadData();
		}
	}

	goToPrevious() {
		const idx = this.pks.findIndex((t) => t === this.record);

		if (idx > 0) {
			const moveToIdx = this.pks[idx - 1];

			let url = this.router
				.createUrlTree([
					this._routing.formViewRecord(
						this.slice.id,
						this.slice.defaultFormId,
						moveToIdx
					)
				])
				.toString();

			this.location.go(url);
			this.mode = FORM_MODE.VIEW;
			this.record = moveToIdx;
			this.valueChanges.unsubscribe();
			this.loadData();
		}
	}

	goToNext() {
		const idx = this.pks.findIndex((t) => t === this.record);

		if (idx < this.pks.length) {
			const moveToIdx = this.pks[idx + 1];

			let url = this.router
				.createUrlTree([
					this._routing.formViewRecord(
						this.slice.id,
						this.slice.defaultFormId,
						moveToIdx
					)
				])
				.toString();

			this.location.go(url);
			this.mode = FORM_MODE.VIEW;
			this.record = moveToIdx;
			this.valueChanges.unsubscribe();
			this.loadData();
		}
	}

	goToLast() {
		const idx = this.pks.findIndex((t) => t === this.record);

		if (idx < this.pks.length) {
			const moveToIdx = this.pks[this.pks.length - 1];

			let url = this.router
				.createUrlTree([
					this._routing.formViewRecord(
						this.slice.id,
						this.slice.defaultFormId,
						moveToIdx
					)
				])
				.toString();

			this.location.go(url);

			this.mode = FORM_MODE.VIEW;
			this.record = moveToIdx;
			this.valueChanges.unsubscribe();
			this.loadData();
		}
	}

	isNextDisabled() {
		if (this.pks.length === 1 || this.record === last(this.pks)) {
			return true;
		} else {
			return false;
		}
	}

	isFirstDisabled() {
		if (this.pks.length === 1 || this.record === head(this.pks)) {
			return true;
		} else {
			return false;
		}
	}

	private _addControl(control: DlFormControl) {
		if (!control.unbound) {
			const f = this.formGroup,
				validators: ValidatorFn[] = [],
				asyncValidators: AsyncValidatorFn[] = [],
				updateOn: 'change' | 'blur' | 'submit' = 'blur';

			if (control.required) {
				validators.push(Validators.required);
			}

			let value = null;
			if (control.type === 'html') {
				value = control.html;
			}
			if (control.selectRelation) {
				control.relatedGrid = this.relations[control.id];
			}

			const formControl = new FormControl(
				{
					disabled: !!control.readonly,
					value: value
				},
				{
					updateOn
				}
			);

			if ('validators' in control) {
				Object.entries(control.validators).forEach(([key, arg]) => {
					switch (key) {
						case 'email':
							validators.push(Validators.email);
							break;
						case 'minLength':
							if (arg > 0) {
								validators.push(Validators.minLength(arg));
							}
							break;
						case 'maxLength':
							if (arg) {
								validators.push(Validators.maxLength(arg));
							}
							break;
						case 'tel':
							validators.push(PhoneNumberValidator(arg));
							break;
						case 'alphanumeric_strict':
							validators.push(AlphanumericStrictValidator);
							break;
						case 'alphabetic_strict':
							validators.push(AlphabeticStrictValidator);
							break;
						case 'tel_extension':
							validators.push(TelExtensionValidator);
							break;
						case 'numeric':
							validators.push(IsNumericValidator);
							break;
						case 'decimalPlaces':
							validators.push(DecimalPlacesValidator(arg));
							break;
						case 'max':
							validators.push(Validators.max(arg));
							break;
						case 'min':
							validators.push(Validators.min(arg));
							break;
						case 'limitToList':
							asyncValidators.push(
								LimitToListValidator(
									control as DlFormControl &
										DlHasLimitToListValidator
								)
							); // this REALLY needs to know the optionList
							break;
						default:
							console.warn('unhandled validator!', { key, arg });
					}
				});
			}

			if (validators.length) {
				formControl.setValidators(validators);
			}
			if (asyncValidators.length) {
				formControl.setAsyncValidators(asyncValidators);
			}

			if (control.id) {
				f.addControl(control.id, formControl);

				this.allControlsWithLabel.push({
					id: control.id,
					label: control.label
				});
			}

			this._formControls.set(control.id, formControl);
		}

		this._controlDefs.set(control.id, control);
		if (control.type === 'control_history') {
			this.historyControls.push({ id: control.id, controlInfo: control });
			this.setHistoryData(control.id, control);
		}
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

	onFileChange(events: any) {
		const event = events.event;
		this.fileControlName = events.label;
		if (event.target.files && event.target.files[0]) {
			var filesAmount = event.target.files.length;
			for (const fileItem of event.target.files) {
				const file: File = fileItem;

				const totalFileSize = file.size;
				const fileSizeInMb = totalFileSize / 1048576;

				this.fileExt = this.app.getExtension(file.name);
				if (this.app.getExtension(file.name)) {
					if (file.type === 'application/pdf') {
						this.fileName = file.name;
						var reader = new FileReader();

						reader.onload = (event: any) => {
							this.pdfs.push({
								pdf: event.target,
								src: event.target.result
							});
							this._cd.detectChanges();
						};
						reader.readAsDataURL(file);
					} else {
						var reader = new FileReader();

						reader.onload = (event: any) => {
							this.images.push({
								img: event.target,
								src: event.target.result
							});
							this._cd.detectChanges();
						};

						reader.readAsDataURL(file);
					}
				}
			}
		}
	}

	removeFiles() {
		this.pdfs = [];
		this.fileName = null;
		//	this._cd.detectChanges();
	}

	onTemplateClick() {
		this.matDialog.open(PreviewComponent, {
			data: {
				parentSliceId: this.slice.parent,
				recordId: this.record
			},
			height: '95vh',
			width: '95vw',
			panelClass: 'temp-preview'
		});
	}
}
export const hasRequiredField = (abstractControl: AbstractControl): boolean => {
	if (abstractControl.validator) {
		const validator = abstractControl.validator({} as AbstractControl);
		if (validator && validator.required) {
			return true;
		}
	}
};
