export function makeSortValue(val: any): string {
	return val || val === 0 ? `${val}`.trim().toLowerCase() : '';
}
