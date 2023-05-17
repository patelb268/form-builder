export type Goolean = 'Yes' | 'No';

export interface JotFieldDef {

	// defined by jot
	allowAddOption?: Goolean;
	allowMultiple?: Goolean; // file upload
	allowOther?: Goolean;
	append?: Goolean; // hide the value when mode = 'edit', and on save, if null, remove from the request so it's ignored
	commaPlace?: Goolean;
	css?: string;
	labelAlign?:string;
	decimal?: string | number;
	defaultValue?: string;
	defaultValueType?: 'formula' | 'psv' | 'constant' | '' /** constant */;
	displayFormula?: string;
	displayWhere?: string;
	embedGrid?: string | number;
	embedQuery?: string;
	embedRegularGrid?: number | string;
	selectRelation?:string;
	extensions?: string; // file upload
	fid?: number;
	fields?: string; // control_history
	sortDescending?:string;
	dateFormat?:string;
	timeFormat?: string;
	format?: 'simpleNumber' | 'currency' | 'percent';
	formLabel?: string;
	Formula?: string;
	grid?: {
		columnOrder?: number;
		width?: number;
		display?: 'none';
	};
	height?: string | number; // camera
	hide: Goolean;
	hideDateTime?: 'Date' | 'Time';
	hideFilenameOnView?: Goolean; // file upload
	hint?: string;
	id: string;
	inline?: boolean;
	inputType?: 'Check Box' | 'Radio Button';
	labelAlt?: string;
	labelWidth?: string | number;
	linkLabel?: string;
	max?: number | string;
	maxFileSize?: number | string; // file
	mcolumns?: string;
	min?: number | string;
	mrows?: string;
	name?: string; // control_grid, control_related_grid
	options?: string;
	order?: number; // WHAT?!
	clearBoth?:boolean;
	parent?: string; // checkboxe
	password?: Goolean;
	previewHeight?: string;
	previewWidth?: string;
	previewAspect?: Goolean;
	relateToSlice?: string; // control_related_dropdown
	relation?: string; // control_related_link
	reportLabel?: string;
	required?: Goolean;
	qid: number;
	qid2?: string;
	showAudit?: Goolean;
	showAuthor?: Goolean; // control_history
	showDate?: Goolean; // control_history
	showLimit?: string; // control_history (string version of a number)
	showTime?: Goolean; // control_history
	size?: number; // this is for input width..
	special?: string; // dropdown, static list chooser
	spreadCols?: number | string;
	status?: 'Open';
	subLabel?: string;
	maxsize?:string;
	changecase?:string;
	text: string;
	useWidth?: string;
	shrink: string;
	tree?: Goolean;
		treeAllowSelectParent?: Goolean;
		treeLabelExpr?: string; // "{label}"
		treeParent?: string; // "parentRef"
		treeRootId?: string; // "3"
	type: string;
	validation?: 'Email' | 'Phone' | 'AlphaNumeric' | 'Alphabetic' | 'Extension' | 'None' | 'Mobile';
	view?: 'button' | 'link'; // control_related_link
	visibility?: 'Hidden';
	width?: string | number;
	datalynk_timeformat?: string;
	dateFormatEdit?: string;
	inTabControl?: Goolean;
	allowSecond?: Goolean;
	allowAMPM?: Goolean;
}

export interface JotMetaPresentationForm {
	activeRedirect: string;
	fields: string[];
	hideUnavailable: Goolean;
	multipleItem: string;
	name: string;
	rdr: string;
	singleItem: string;
	size: {width: string | number, height: number | number};
	sourceHtml: string;
	conditions: any[];
	template: any[];
	thanktext: string;
	isLegacy?: true;
}

export interface JotMetaPresentationFields {
	[fieldName: string]: JotFieldDef;
}
export interface JotMetaPresentationForms {
	[formId: number]: JotMetaPresentationForm;
}

export interface JotMetaPresentation {
	fields: JotMetaPresentationFields;
	forms: JotMetaPresentationForms;
}

export interface JotMeta {
	presentation: JotMetaPresentation;
}
