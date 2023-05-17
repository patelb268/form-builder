export function sameDate(a: Date, b: Date): boolean {
	return new Date(a).setHours(0,0,0,0) === new Date(b).setHours(0,0,0,0);
}