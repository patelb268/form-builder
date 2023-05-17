import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { head, last } from 'lodash';
import {
	DlContainerChild,
	DlContainers,
	DlControlWrapContainer,
	DlDefaultValues,
	DlForm
} from '../../form/models/container';
import {
	DlCheckboxControl,
	DlFileControlAccept,
	DlFormControl,
	DlValidators,
	OptionRow
} from '../../form/models/control';
import { Expression } from '../models/expression';
import {
	JotFieldDef,
	JotMetaPresentation,
	JotMetaPresentationForm
} from '../models/jot';
import { Slice } from '../models/slice';
import { TranslatePipe } from '../pipes/translate.pipe';
import { decimalToStep } from '../utils/decimalToStep';
import { CURLY_BRACES } from '../utils/regex';

@Injectable({
	providedIn: 'root'
})
export class FormService {
	// static legacyFieldConverters: {[key: string]: (def: JotFieldDef) => }

	constructor(@Inject(DOCUMENT) private _doc: Document) {}

	parseForm(form: DlForm | JotMetaPresentationForm, slice: Slice): DlForm {
		if (form.isLegacy) {
			return this.parseLegacyForm(form, slice);
		} else {
			throw '@@todo';
		}
	}

	parseConditions(f) {
		let conds = null;
		let checker = f.replace(/\n/g, ''); // strip out the new lines
		let footer = checker.match(/JotForm.setConditions\((.*)\);JotForm/);
		if (footer && footer[1]) {
			try {
				conds = ('' + footer[1]).replace(/\);/, '');
				conds = JSON.parse(conds);
			} catch (e) {
				conds = false;
				console.warn(
					'i found a match on the conditions, but i shit the bed trying to parse it, check the logic to parse',
					{ matched: footer }
				);
			}
		} else {
			console.warn('no conditions were parsed');
		}
		return conds;
	}

	parseLegacyForm(legacy: JotMetaPresentationForm, slice: Slice): DlForm {
		const children: DlContainerChild[] = [],
			meta = (slice.root || slice).meta
				.presentation as JotMetaPresentation,
			metaFields = meta.fields,
			qidMap = new Map(
				Object.entries(metaFields).map(([k, v]) => [v.qid, v])
			),
			defaultValues: DlDefaultValues = {},
			form: DlForm = {
				id: null,
				type: 'form',
				isLegacy: false,
				slice: slice.id,
				children,
				defaultValues,
				layoutSize: legacy.size,
				conditions:
					legacy.conditions || this.parseConditions(legacy.sourceHtml)
			},
			locale = TranslatePipe.locale;

		let node = this._doc.createElement('div');
		node.innerHTML = legacy.sourceHtml || '';
		node = node.querySelector('form.jotform-form .form-all');

		if (!node) {
			console.warn(
				'unable to find saved structure, please resave your application'
			);
			return;
		}

		console.warn(
			'@@todo - we need maxLength, min & max (number) info in the fid_properties'
		);
		console.log('fids\n', slice.fids);

		Array.from(
			node.querySelectorAll<HTMLUListElement>(
				'ul[class^="form-section"], ul[class*=" form-section"]'
			)
		).forEach((ulNode) => {
			const cIdChunks = this._legacyIdToQid(ulNode.id),
				cQid = cIdChunks[0],
				cDef = qidMap.get(cQid);

			let container: DlContainers, expression: string;

			if (cDef && cDef.type === 'control_collapse') {
				container = {
					type: 'collapse',
					children: [],
					expanded: !!(cDef.status === 'Open'),
					hidden: cDef.visibility === 'Hidden' ? true : false,
					flex: '1 1 auto',
					label: cDef.text,
					inTabControl: cDef.inTabControl,
					css: cDef.css,
					id: cDef.id,
					mainControls: []
				};
			} else {
				container = {
					type: 'div',
					children: [],

					label: '',
					id: cDef?.id || null,
					mainControls: []
				};
			}

			// add the controls to the container
			Array.from(
				ulNode.querySelectorAll<HTMLLIElement>(
					'li.form-line, li.form-line-column'
				)
			).forEach((liNode) => {
				const idChunks = this._legacyIdToQid(liNode.id),
					qid = idChunks[0],
					def = qidMap.get(qid);

				const inline =
					liNode.classList.contains('form-line-column') &&
					!liNode.classList.contains('form-line-column-clear');
				// const inline =
				// def && def.shrink=== "Yes" && !hasCearClass ? true: false

				const clearBoth = liNode.classList.contains(
					'form-line-column-clear'
				);

				const isColumnClass =
					liNode.classList.contains('form-line-column');
				let control: DlFormControl,
					readonly = false;

				if (def) {
					const label = def.text,
						subLabel = (def.subLabel || '').trim() || null,
						hint = def.hint || null,
						size = def.size,
						maxsize = def.maxsize,
						changecase = def.changecase
							? def.changecase.toLowerCase()
							: 'normal',
						fidMatch = slice.fidById(def.name),
						hide = def.hide === 'Yes' ? true : false,
						fid = fidMatch ? fidMatch.id : null,
						maxWidth = this._legacySizeToWidth(def.size),
						validators: DlValidators = {};
					let required = !!(def.required === 'Yes');

					if (def.defaultValueType || def.defaultValue) {
						switch (def.defaultValueType) {
							case 'psv':
								defaultValues[def.id] = 'psv';
								break;
							case 'formula':
								defaultValues[def.id] = {
									expr: def.defaultValue
								};
								break;
							case '':
								if (def.defaultValue) {
									defaultValues[def.id] = {
										value: def.defaultValue
									};
								}
								break;
							default:
								console.warn(
									'unhandled defaultValueType',
									def.defaultValueType
								);
						}
					}
					expression = def ? def.Formula : null;

					/** THE FID MAY BE WRONG, START HERE */

					switch (def.type) {
						case 'control_grid':
						case 'control_related_grid':
							control = {
								css: def.css,
								displayWhere: def.displayWhere,
								embedQuery: def.embedQuery,
								embedRegularGrid: def.embedRegularGrid,
								height: def.height,
								hide: false,
								id: def.id,
								labelAlign: def.labelAlign,
								name: def.name,
								order: def.order,
								qid: def.qid,
								reportLabel: def.reportLabel,
								subLabel: def.subLabel,
								text: def.text,
								selectRelation: def.selectRelation,
								related:
									def.type === 'control_related_grid'
										? true
										: false,
								type: 'control_grid',
								useWidth: def.useWidth,
								width: def.width,
								inputType: 'text'
							};
							break;
						case 'control_text':
							control = {
								type: 'html',
								html: def.text,
								id: def.id,
								inline,
								expression: def.Formula,
								hint,
								subLabel,
								size,
								maxsize,
								order: def.order,
								clearBoth,
								isColumnClass,
								changecase,
								hide
							};
							container.mainControls.push({
								name: def.text,
								type: def.type
							});
							break;
						case 'control_formula_html': // no, this is some stupid html container
							control = {
								type: 'html',
								html: def.text,
								id: def.id,
								inline,
								expression: def.Formula,
								subType: 'control_formula_html',
								hint,
								subLabel,
								size,
								maxsize,
								order: def.order,
								clearBoth,
								isColumnClass,
								changecase,
								hide
							};
							container.mainControls.push({
								name: def.text,
								type: def.type
							});
							break;

						case 'control_formula_text':
							readonly = true;
							required = false;
							expression = def.Formula;
							control = {
								type: 'textbox',
								inputType: 'text',
								label,
								fid, // the PERMS shoudl restrict edit on formula controls
								id: def.id,
								inline,
								maxWidth,
								validators,
								readonly,
								expression,
								required,
								hint,
								subLabel,
								width: def.width ? def.width + 'px' : 'auto',
								size,
								maxsize,
								order: def.order,
								clearBoth,
								isColumnClass,
								changecase,
								hide
							};

							order: def.order;
						case 'control_textbox':
							control = {
								type: 'textbox',
								inputType: 'text',
								label,
								fid, // the PERMS shoudl restrict edit on formula controls
								id: def.id,
								inline,
								maxWidth,
								validators,
								readonly,
								expression,
								required,
								hint,
								subLabel,
								size,
								maxsize,
								order: def.order,
								clearBoth,
								isColumnClass,
								changecase,
								hide
							};
							if (def.validation === 'Email') {
								control.inputType = 'email';
								validators.email = true;
							}
							if (def.validation === 'Phone') {
								control.inputType = 'tel';
								validators.tel = true;
							}
							if (def.validation === 'AlphaNumeric') {
								validators.alphanumeric_strict = true;
							}
							if (def.validation === 'Alphabetic') {
								validators.alphabetic_strict = true;
							}
							if (def.validation === 'Extension') {
								validators.tel_extension = true;
								control.inputType = 'tel';
							}
							break;

						case 'control_number':
						case 'control_formula_number':
							expression = def.Formula;
							const decimalPlaces = +def.decimal || 0,
								min = def.min ? +(def.min || 0) : null,
								max = def.max ? +(def.max || 0) : null;

							control = {
								type: 'numberbox',
								inputType: 'number',
								label,
								id: def.id,
								order: def.order,
								clearBoth,
								fid,
								width: def.width ? def.width + 'px' : 'auto',
								inline,
								readonly,
								expression,
								decimalPlaces,
								validators,
								css: def.css,
								labelCss: this.getLabelCss(def.css),
								textCss: this.getTextCss(def.css),
								required,
								maxWidth: this._legacyWidthToWidth(def.width),
								hint,
								isColumnClass,

								subLabel,
								size,
								maxsize,
								hide,
								changecase
							};
							switch (def.format) {
								case 'currency':
									control.currency = {
										locale,
										currency: '$',
										currencyCode: 'CAD'
									};
									control.decimalPlaces = 2;
									break;
								case 'percent':
									control.symbol = '%';
									break;
								// simpleNumber
							}

							if (min || min === 0) {
								validators.min = min;
								control.min = min;
							}
							if (max || max === 0) {
								validators.max = max;
								control.max = max;
							}
							// now that we are done with the coerce
							control.step = decimalToStep(control.decimalPlaces);
							validators.numeric = true;
							validators.decimalPlaces = control.decimalPlaces;

							break;

						case 'control_dropdown':
							control = {
								type: 'dropdown',
								label,
								id: def.id,
								fid,
								inline,
								readonly,
								expression,
								required,
								order: def.order,
								clearBoth,
								hide,
								width: def.width ? def.width + 'px' : 'auto',
								size,
								maxsize,
								isColumnClass,
								validators,
								hint,
								options: this._legacyOptionsToOptionRows(
									def.options
								)
							};
							if (def.special && def.special !== 'None') {
								control.fetch = {
									url: `/assets/json/${def.special
										.toLowerCase()
										.replace(' ', '')}.json`,
									cacheable: true
								};
								control.limit = 250;
							}
							validators.limitToList = true;
							break;

						case 'control_related_dropdown':
							control = {
								type: 'relatedDropdown',
								label,
								id: def.id,
								fid,
								inline,
								order: def.order,
								clearBoth,
								isColumnClass,
								readonly,
								expression,
								hide,
								validators,
								required,
								hint,
								size,
								width: def.width ? def.width + 'px' : 'auto',
								maxsize,
								maxWidth: this._legacyWidthToWidth(def.width),
								query: {
									slice: +def.relateToSlice,
									value: ['$field', 'id'],
									label: { $excel: def.displayFormula },
									where: this._legacyRelatedWhereToQueryWhere(
										def
									)
								},
								limit: 50
							};
							validators.limitToList = true;
							break;

						case 'control_formula_textarea':
							readonly = true;
							required = false;
							expression = def.Formula;
							control = {
								type: 'textarea',
								label,
								id: def.id,
								width: def.width ? def.width + 'px' : 'auto',
								fid,
								inline,
								hide,
								order: def.order,
								clearBoth: true,
								isColumnClass,
								hint,
								size,
								maxsize,
								readonly,
								expression,
								validators,
								required
							};

						case 'control_history':
							readonly = true;
							required = false;
							control = {
								type: 'control_history',
								label,
								id: def.id,
								width: def.width ? def.width + 'px' : 'auto',
								fid,
								inline,
								hide,
								order: def.order,
								clearBoth: true,
								isColumnClass,
								hint,
								size,
								maxsize,
								readonly,
								expression,
								validators,
								required,
								css: def.css,
								dateFormat: def.dateFormat,
								fields: def.fields,
								height: def.height,
								
								labelAlign: def.labelAlign,
								name: def.name,
								
								qid: def.qid,
								reportLabel: def.reportLabel,
								showAuthor: def.showAuthor,
								showDate: def.showDate,
								showLimit: def.showLimit,
								showTime: def.showTime,
								shrink: def.shrink,
								sortDescending: def.sortDescending,
								text: def.text,
								timeFormat: def.timeFormat,
								
								
							};
							break;

						case 'control_textarea':
							control = {
								type: 'textarea',
								label,
								id: def.id,
								width: def.width ? def.width + 'px' : 'auto',
								fid,
								inline,
								hide,
								order: def.order,
								clearBoth: true,
								isColumnClass,
								hint,
								size,
								maxsize,
								readonly,
								expression,
								validators,
								required
							};
							if (+def.width) {
								control.maxWidth = +def.width;
							}
							break;

						case 'control_formula_date':
							readonly = true;
							required = false;
							expression = def.Formula;
							control = {
								type: 'control_date',
								inputType: 'text',
								label,
								id: def.id,
								fid,
								order: def.order,
								clearBoth,
								isColumnClass,
								inline,
								hide,
								width: def.width ? def.width + 'px' : 'auto',
								hint,
								readonly,
								expression,
								datalynk_timeformat: def.format,
								dateFormatEdit: def.dateFormatEdit,
								validators,
								size,
								maxsize
							};
							if (+def.width) {
								control.maxWidth = +def.width;
							}
							break;
						case 'control_date':
							control = {
								type: 'control_date',
								inputType: 'text',
								label,
								id: def.id,
								fid,
								order: def.order,
								clearBoth,
								isColumnClass,
								inline,
								hide,
								width: def.width ? def.width + 'px' : 'auto',
								hint,
								required,
								readonly,
								expression,
								datalynk_timeformat: def.format,
								dateFormatEdit: def.dateFormatEdit,
								validators,
								size,
								maxsize
							};
							if (+def.width) {
								control.maxWidth = +def.width;
							}
							break;
						case 'control_timetextbox':
							control = {
								type: 'control_timetextbox',
								inputType: 'text',
								label,
								id: def.id,
								fid,
								width: def.width ? def.width + 'px' : 'auto',
								inline,
								hide,
								size,
								maxsize,
								order: def.order,
								clearBoth,
								isColumnClass,
								datalynk_timeformat: def.datalynk_timeformat,
								dateFormatEdit: def.dateFormatEdit,
								required,
								hint,
								readonly,
								expression,
								validators
							};
							if (+def.width) {
								control.maxWidth = +def.width;
							}
							break;

						case 'control_formula_date_time':
							expression = def.Formula;

							control = {
								type: 'control_new_datetime',
								inputType: 'text',
								label,
								id: def.id,
								fid,
								inline,
								order: def.order,
								clearBoth,
								isColumnClass,
								hint,
								size,
								required: false,
								datalynk_timeformat: def.format,
								dateFormatEdit: def.dateFormatEdit,
								width: def.width ? def.width + 'px' : 'auto',
								maxsize,
								readonly: true,
								hide,
								hideDateTime: def.hideDateTime,
								allowSecond: def.allowSecond,
								allowAMPM: def.allowAMPM,
								expression,
								validators
							};
							if (+def.width) {
								control.maxWidth = +def.width;
							}
							break;

						case 'control_new_datetime':
							control = {
								type: 'control_new_datetime',
								inputType: 'text',
								label,
								id: def.id,
								fid,
								hideDateTime: def.hideDateTime,
								allowSecond: def.allowSecond,
								allowAMPM: def.allowAMPM,
								inline,
								order: def.order,
								clearBoth,
								isColumnClass,

								hint,
								size,
								required,
								datalynk_timeformat: def.format,
								dateFormatEdit: def.dateFormatEdit,
								width: def.width ? def.width + 'px' : 'auto',
								maxsize,
								readonly,
								hide,
								expression,
								validators
							};
							if (+def.width) {
								control.maxWidth = +def.width;
							}
							break;

						case 'control_checkbox':
							const options = this._legacyOptionsToArray(
									def.options
								),
								kids: DlCheckboxControl[] = options.map(
									(o, idx) => {
										const cbId = `${def.id}_${idx}`,
											cbFidMatch = slice.fidById(cbId),
											cbFid = cbFidMatch?.id || null;
										return {
											type: 'checkbox',
											id: cbId,
											label: o,

											fid: cbFid,
											readonly,
											labelCss: this.getLabelCss(def.css),
											textCss: this.getTextCss(def.css),
											spreadCols: def.spreadCols
												? +def.spreadCols
												: 1,
											labelWidth: def.labelWidth
												? def.labelWidth + 'px'
												: 'auto',
											idx
										};
									}
								),
								cont: DlControlWrapContainer = {
									type: 'controlWrap',
									id: def.id,
									children: kids,
									subType: 'checkbox',
									label,
									labelCss: this.getLabelCss(def.css),
									textCss: this.getTextCss(def.css),
									order: def.order,
									clearBoth,
									required,
									isColumnClass,
									spreadCols: def.spreadCols,
									inline,
									fitContent: true
								};
							// now, as a hack, add an option, that is the label, less 2 characters???
							kids.push({
								type: 'checkbox',
								label,
								labelCss: this.getLabelCss(def.css),
								textCss: this.getTextCss(def.css),
								required,
								id: null,
								labelHack: true
							});
							container.children.push(cont);
							break;

						case 'control_radio':
							control = {
								type: 'radio',
								label,
								id: def.id,
								fid,
								order: def.order,
								clearBoth,
								hide,
								isColumnClass,
								inline,
								readonly,
								expression,
								size,
								maxsize,
								validators,
								required,
								hint,
								options: this._legacyOptionsToOptionRows(
									def.options
								),
								spreadCols: def.spreadCols
									? +def.spreadCols
									: 1,
								labelWidth: def.labelWidth
									? def.labelWidth + 'px'
									: 'auto'
							};
							validators.limitToList = true;
							break;

						// case 'control_camera':
						case 'control_fileupload':
							container.children.push({
								type: 'controlWrap',
								id: def.id,
								label,
								order: def.order,
								clearBoth,
								isColumnClass,
								labelCss: this.getLabelCss(def.css),
								textCss: this.getTextCss(def.css),
								inline,
								hint,

								required,

								children: [
									{
										type: 'file',
										id: def.id,
										fid,
										readonly,
										multiple: def.allowMultiple === 'Yes',
										maxFileSize: +def.maxFileSize,
										accept: this._legacyFileToAccept(def),
										required,
										textCss: this.getTextCss(def.css),
										preview: {
											width: `${def.previewWidth}px`,
											height: `${def.previewHeight}px`,
											hideMeta: !!(
												def.hideFilenameOnView === 'Yes'
											)
										}
									}
								]
							});
							console.log('file', { def, control });
							return;
					}
				}
				if (!control) {
					console.warn(
						'NO DEF FOUND',
						def ? def.type : 'no_def_type',
						{ def, inline, liNode }
					);
				} else {
					control.css = def.css;
					control.labelAlign = def.labelAlign;
					control.labelCss = this.getLabelCss(def.css);
					control.textCss = this.getTextCss(def.css);
					container.children.push(control);
				}

				// console.log('child found', {def, inline, liNode});
			});

			container.children = container.children.sort(
				(a, b) => a.order - b.order
			);

			// add the container to the form itself
			children.push(container);
		});

		console.log('returning', form);

		return form;
	}

	getLabelCss(css): string {
		if (css) {
			const data = css.split('label:').join('').split('text:');
			if (data.length) {
				return head(data);
			}
		}
		return null;
	}
	getTextCss(css): string {
		if (css) {
			const data = css.split('label:').join('').split('text:');
			if (data.length) {
				return last(data);
			}
		}
		return null;
	}

	private _legacyFileToAccept(def: JotFieldDef) {
		const extensions = def.extensions
				.split(', ')
				.map((x) => (x || '').trim().toLowerCase())
				.filter((x) => !!x),
			image = ['jpg', 'gif', 'bmp', 'png'].some((x) =>
				extensions.includes(x)
			),
			video = ['mov', 'avi', 'mp4', 'mpg'].some((x) =>
				extensions.includes(x)
			),
			audio = ['midi', 'mp3', 'wav', 'wma'].some((x) =>
				extensions.includes(x)
			),
			ret: DlFileControlAccept = {
				extensions,
				image,
				video,
				audio
			};
		return ret;
	}

	private _legacyIdToQid(id: string): number[] {
		return (id || '')
			.split('_')
			.filter((x) => parseInt(x) === +x)
			.map((x) => +x);
	}

	private _legacySizeToWidth(size: number): number {
		return size * 11;
	}

	private _legacyWidthToWidth(px: string | number) {
		return +px * 1.25;
	}

	private _legacyOptionsToOptionRows(options: string): OptionRow[] {
		return this._legacyOptionsToArray(options).map((o) => ({
			_v: o,
			_l: o
		}));
	}

	private _legacyOptionsToArray(options: string): string[] {
		return options.split('|');
	}

	// converts the where clause to be scoped to the target slice, with FORM RECORD
	// references being double curly wrapped
	private _legacyRelatedWhereToQueryWhere(def: JotFieldDef): Expression {
		// console.log('_legacyRelatedWhereToQueryWhere', def);
		const name = def.name;
		if (def.displayWhere) {
			return def.displayWhere.replace(
				CURLY_BRACES,
				(full, txt: string) => {
					const chunks = txt.split(':');
					if (chunks.length > 1 && chunks[0] === name) {
						return `{${chunks.slice(1).join(':')}}`;
					} else {
						return `{${full}}`; // i'm not 100% settled on this, but for now, its established
					}
				}
			);
		}
		return null;
	}
}
