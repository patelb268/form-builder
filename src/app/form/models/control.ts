import { Observable } from 'rxjs';
import { Expression } from 'src/app/shared/models/expression';
import { Goolean } from 'src/app/shared/models/jot';
import { DlCommon } from './common';

export type OptionRowValue = string | number | Date | boolean;
export interface OptionRow {
	_v: OptionRowValue;
	_l: string;
}

export interface DlControlBase extends DlCommon {
	expression?: string;
	fid?: number;
	requires?: string[];
	validators?: DlValidators;
	children?: any[];
}

export interface DlValidators {
	alphanumeric_strict?: boolean;
	alphabetic_strict?: boolean;
	email?: boolean;
	min?: number;
	minLength?: number;
	max?: number;
	maxLength?: number;
	numeric?: boolean;
	pattern?: string;
	tel?: boolean;
	tel_extension?: boolean;
	decimalPlaces?: number;
	limitToList?: boolean;
}

export type DlNotInListValidationFn = (
	val: OptionRowValue
) => Observable<boolean>;

export interface DlHasLimitToListValidator {
	_notInListValidation: DlNotInListValidationFn;
}

export interface HtmlTextProps extends DlControlBase {
	autocomplete?: string;
	autocorrect?: boolean;
	autocapitalize?:
		| 'off'
		| 'none'
		| 'on'
		| 'sentences'
		| 'words'
		| 'characters';
	placeholder?: string;
	spellcheck?: boolean;
}

export interface DlHtmlInputElementBase extends HtmlTextProps {
	inputType:
		| 'email'
		| 'hidden'
		| 'number'
		| 'password'
		| 'search'
		| 'tel'
		| 'text'
		| 'url'; // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#%3Cinput%3E_types
}

export interface DlTextboxControl extends DlHtmlInputElementBase {
	type: 'textbox';
}

export interface DlEmbeddedGrid extends DlHtmlInputElementBase {
	type: 'control_grid';
	displayWhere: string;
	embedQuery: any;
	embedRegularGrid: string | number;
	height: string | number;
	name: string;
	qid: number;
	reportLabel: string;
	text: string;
	useWidth: string;
	selectRelation:string;
}

export interface DlControlHistory extends DlControlBase {
	type: 'control_history';
	height: string | number;
	name: string;
	qid: number;
	reportLabel: string;
	text: string;
	showAuthor: string;
	showDate: string;
	showLimit: string;
	showTime: string;
	shrink: string;
	
	fields?:string;
	sortDescending?:string;
	dateFormat?:string;
	timeFormat?: string;
}

export interface DlDate extends DlHtmlInputElementBase {
	type: 'control_date' | 'control_timetextbox' | 'control_new_datetime';
	hideDateTime?: string;
	allowSecond?: Goolean;
	allowAMPM?: Goolean;
}

export interface DlNumberboxControl extends DlHtmlInputElementBase {
	type: 'numberbox';
	placeholder?: string;
	min?: number;
	max?: number;

	symbol?: string;
	currency?: {
		locale: string;
		currency: string;
		currencyCode?: string; // https://en.wikipedia.org/wiki/ISO_4217
		digitsInfo?: string;
	};
	decimalPlaces?: number;
	step?: number;
}

export interface DlTextareaControl extends HtmlTextProps {
	type: 'textarea';
	maxRows?: number;
	minRows?: number;
	staticSize?: boolean;
}

export interface DlHistoryControl extends HtmlTextProps {
	type: 'textarea';
	maxRows?: number;
	minRows?: number;
	staticSize?: boolean;
	
}

export interface DlHtmlControl extends DlControlBase {
	type: 'html';
	html: Expression;
	subType?: any;
}

export interface DlDropdownBase extends DlControlBase {
	placeholder?: string;
	limit?: number;
}

export interface DlDropdownControl extends DlDropdownBase {
	type: 'dropdown';
	options?: OptionRow[];
	fetch?: {
		url?: string;
		cacheable: boolean;
	};
	refreshOn?: string[];
	_notInListValidation?: DlNotInListValidationFn; // this should get set back in the CONTROL instance...
}

// related
export interface DlRelatedDropdownControl extends DlDropdownBase {
	type: 'relatedDropdown';
	query?: DlRelatedControlQuery;
	_notInListValidation?: DlNotInListValidationFn;
}

export interface DlRelatedControlQuery {
	slice: number; // if omitted, will try to fall back on the loaded slice!
	label: Expression;
	value: Expression;

	distinct?: boolean;
	where?: Expression;
	sort?: Expression;
}

// checkbox
export interface DlCheckboxControl extends DlControlBase {
	type: 'checkbox';
	labelHack?: boolean;
	options?: OptionRow[];
	fetch?: {
		url?: string;
		cacheable: boolean;
	};
}

export interface DlRadioControl extends DlControlBase {
	type: 'radio';
	options?: OptionRow[];
	labelHack?: boolean;
	fetch?: {
		url?: string;
		cacheable: boolean;
	};
}

export interface DlFileControlAccept {
	extensions?: string[];
	image?: boolean; // https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/accept
	video?: boolean; // https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/accept
	audio?: boolean; // https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/accept
	capture?: 'user' | 'environment'; // experimental https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/capture
}

export interface DlFileControl extends DlControlBase {
	type: 'file';
	multiple?: boolean;
	maxFileSize?: number;
	preview?:
		| false
		| {
				width: string;
				height: string;
				hideMeta?: boolean;
		  };
	accept?: DlFileControlAccept;
}

export type DlFormControl =
	| DlDropdownControl
	| DlHtmlControl
	| DlTextboxControl
	| DlNumberboxControl
	| DlTextareaControl
	| DlRelatedDropdownControl
	| DlCheckboxControl
	| DlFileControl
	| DlRadioControl
	| DlDate
	| DlEmbeddedGrid
	| DlControlHistory;
