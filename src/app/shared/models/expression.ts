interface ExcelExpression {$excel: string; }
type NativeExpression = any[];

export type Expression = string | ExcelExpression | NativeExpression;
export type ExpressionStrict = ExcelExpression | NativeExpression;
export type WhereExpression = ExcelExpression | NativeExpression | {[key: string]: Expression} | {[key: number]: Expression};
