import { ExpressionStrict, Expression } from 'src/app/shared/models/expression';
import { Goolean } from 'src/app/shared/models/jot';

// import { Expression, ExpressionStrict } from '../expression';

export interface DlCommon {

	flex?: string;

	hidden?: boolean | ExpressionStrict;
	inTabControl?:Goolean;

	hint?: string;
	width?: number | string;
	id: string;

	inline?: boolean;

	subLabel?: string;
	label?: Expression;
	maxsize?: string;
	labelWidth?: string;

	labelTranslate?: boolean;

	maxWidth?: number;
	size?: any;

	showAudit?: boolean;
	minWidth?: number;

	readonly?: boolean;

	required?: boolean;

	unbound?: boolean;
	datalynk_timeformat?: string; 
	dateFormatEdit?: string;
	selectRelation?:string;
	related?: boolean;

	relatedGrid?: any;
	order?: number;
	clearBoth?:boolean;
	spreadCols?: number | string;
	idx?: number;
	isColumnClass?: boolean;
	changecase?:string;
	hide?: boolean;
	css?: string;
	
	labelAlign?: string;
	labelCss?: string;
	textCss?: string;
	hideDateTime?: string;
	allowSecond?: Goolean;
	allowAMPM?: Goolean;
	mainControls?: any[];
}
