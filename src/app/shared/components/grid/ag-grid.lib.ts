import { Expression } from 'src/app/shared/models/expression';
import { ControlTextboxComponent } from 'src/app/form/controls/control-textbox/control-textbox.component';
import { ControlCheckboxComponent } from 'src/app/form/controls/control-checkbox/control-checkbox.component';
import { ThemePalette } from '@angular/material/core';
import { Action } from '@services/actions.service';
import { Observable } from 'rxjs';
import { ControlTextareaComponent } from 'src/app/form/controls/control-textarea/control-textarea.component';

export interface RowTemplateAction {
	templateSlice?: number | string;
	templateHtml?: string;
}
export type OnClickActions = RowTemplateAction;

export interface SerializedColDef {
	field?: string;
	hide?: boolean;
	label?: string | false;
	labelTranslate?: boolean;
	onClick?: OnClickActions;
	renderer?: string; // @@todo -> make this a keyof of the grid.components instance
	rendererParams?: object; // data that will get mixed into the params for each instance's agInit
	valueFormatter?: Expression;
	valueTranslate?: boolean;
	width?: number;
	flex?: number;
	minWidth?: number;
	maxWidth?: number;
	getValue?: (row: any) => any;
	setValue?: (value: any, row: any) => boolean;
	editor?: string;
	editorParams?: any;
	align?: 'center' | 'left' | 'right' | 'justified';
	sort?: 'asc' | 'desc';
	sortedAt?: number;
	pinned?: 'left' | 'right';
	lockPosition?: boolean;
	lockPinned?: boolean;
}

export interface DisableFeatures {
	addRecord?: boolean;
	header?: boolean;
	hideHeaderTitle?:boolean;
	hideHeaderButtons?: boolean;
	columnHeaders?: boolean;
	print?: boolean;
	viewRecord?: boolean;
	editRecord?: boolean;
	deleteRecord?: boolean;
	hideAddRelated?: boolean;
	hidePrint?: number;
	hideAddRecord?: number;
	description?: boolean;
	selector?: boolean;
	polling?: boolean;
	inlineEdit?: boolean;
	refreshInterval?: number;
	refreshAuto?: number;
}
export interface EnableFeatures {
	columnPicker?: boolean;
}

export interface GridColumns {
	[label: string]: SerializedColDef;
}

export interface GridSerialized<R = any> {
	autoExpandGroups?: boolean | string[];
	columnOrder?: string[];
	columns?: GridColumns;
	disable?: DisableFeatures;
	enable?: EnableFeatures;
	labelTranslate?: boolean;
	title?: string;
	titleTranslate?: boolean;
	icon?: string;
	iconColor?: ThemePalette;
	iconTranslate?: boolean;
	onOpen?: Action[];
	data?: R[] | Observable<R[]>;
	showRowNumbers?: boolean;
	ignoreFids?: boolean;
	hideGroupRows?: boolean;
	readonly?: boolean;
	forceColumnsFromQueryParams?: boolean;
	showAllColumns?: boolean;
}

// https://www.ag-grid.com/javascript-grid-filtering/
export enum DEFAULT_COLUMN_FILTERS {
	'bit' = 'agNumberColumnFilter',
	'datetime' = 'agDateColumnFilter',
	'number' = 'agNumberColumnFilter',
	'string' = 'agTextColumnFilter',
}

// http://sandbox.datalynk:4200/grid/notifications
export enum OPERATOR_MAP {

}

export type AgGridFilterOperator = 'AND' | 'OR';

export interface AgFilterDate {
	dateFrom: string;
	dateTo?: string;
	filterType: 'date';
	type: 'equals' | 'range' | 'greaterThan' | 'lessThan' | 'notEqual';
}

export interface AgFilterText {
	filterType: 'text';
	filter: string;
	type: 'equals' | 'contains';
}

export type AgGridFilterModelSingle = AgFilterDate | AgFilterText;

export interface AgGridFilterModelMultiple {
	operator: AgGridFilterOperator;
	condition1: AgGridFilterModelSingle;
	condition2: AgGridFilterModelSingle;
}
export interface AgGridFilterModel {
	[columnId: string]: AgGridFilterModelSingle | AgGridFilterModelMultiple;
}

export const expressionExpander = {
	date: {
		equals(field: string, filter: AgFilterDate) {
			return ['$eq', ['$date', ['$field', field]], ['$date', ... filter.dateFrom.split('-')]];
		}
	},
	text: {
		contains(field: string, filter: AgFilterText) {
			return ['$contains', ['$field', field], filter.filter];
		},
		notContains(field: string, filter: AgFilterText) {
			return ['$not', expressionExpander.text.contains(field, filter)];
		},
		equals(field: string, filter: AgFilterText) {
			return ['$eq', ['$field', field], filter.filter];
		},
		notEqual(field: string, filter: AgFilterText) {
			return ['$neq', ['$field', field], filter.filter];
		},
		startsWith(field: string, filter: AgFilterText) {
			return ['$like', ['$field', field], filter.filter + '%'];
		},
		endsWith(field: string, filter: AgFilterText) {
			return ['$like', ['$field', field], '%' + filter.filter];
		},
	}
};


export enum EDITOR {
	CHECKBOX = 'checkbox',
	TEXTBOX = 'textbox',
	TEXTAREA = 'textarea',
}

export const controls = new Map<EDITOR, any>([
	[EDITOR.CHECKBOX, ControlCheckboxComponent],
	[EDITOR.TEXTBOX, ControlTextboxComponent],
	[EDITOR.TEXTAREA, ControlTextareaComponent],
]);

export interface AgGridComponentData {
	routed?: boolean; // was this directly routed to?
	slice?: string | number;
}
