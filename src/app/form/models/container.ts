import { DlFormControl } from "./control";
import { DlCommon } from "./common";
import { GridSerialized } from "src/app/shared/components/grid/ag-grid.lib";
import { ExpressionStrict, Expression } from "src/app/shared/models/expression";
import { Goolean } from "src/app/shared/models/jot";

export type DlContainerChild = DlContainers | DlFormControl;

export interface DlContainerBase extends DlCommon {
	children?: DlContainerChild[];
	fitContent?: boolean;
}

export type DlDefaultValuePsv = "psv";
export interface DlDefaultValueExpression {
	expr: string;
}
export interface DlDefaultValueConstant {
	value: string | number | Date | boolean;
}

type DlDefaultValue =
	| DlDefaultValuePsv
	| DlDefaultValueExpression
	| DlDefaultValueConstant;
export interface DlDefaultValues {
	[fieldId: string]: DlDefaultValue;
}

export interface DlForm extends DlContainerBase {
	isLegacy?: false;
	type: "form";
	slice?: number;
	layoutSize?: { width: string | number; height: number };
	conditions: Conditions[];
	defaultValues?: DlDefaultValues;
}

export interface Conditions {
	action: Action[];
	terms: Terms[];
	link: Link;
}

export enum Link {
	All = "All",
	Any = "Any",
}

export interface Action {
	field: string;
	visibility?: Visibility;
	prompt?: string;
}

export interface Terms {
	field: string;
	operator: Operator;
	value?: string | number;
}

export enum Visibility {
	Show = "Show",
	Hide = "Hide",
	Make_Required="make_required",
	Enable ='enable',
	Disable= 'disable'
}

export enum Operator {
	isFilled = "isFilled",
	lessThan = "lessThan",
	greaterThan = "greaterThan",
	equals = "equals",
	notEqual = "notEquals",
	contains = "contains",
	notConta = "notContains",
	isEmpty = "isEmpty",
	endsWith = "endsWith",
	before = "before",
	after = "after"
}

export interface DlDivContainer extends DlContainerBase {
	type: "div";
	mainControls?: any[]
}

export interface DlCollapseContainer extends DlContainerBase {
	type: "collapse";
	expanded?: boolean | ExpressionStrict;
	inTabControl?: Goolean;

	mainControls?: any[]
}

export interface DlControlWrapContainer extends DlContainerBase {
	type: "controlWrap";
	mainControls?: any[]
	subType?: any;
}

export interface DlGridContainer extends DlContainerBase {
	type: "grid";
	grid?: {
		slice?: number | string;
		config?: GridSerialized;
	};
	query?: {
		where?: Expression;
	};
	refreshOn?: string[]; // id.event (if !event, assumed "change")
	requires?: string[];
}

export type DlContainers =
	| DlDivContainer
	| DlCollapseContainer
	| DlControlWrapContainer;
