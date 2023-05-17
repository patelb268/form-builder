
export function betweenDates(date: Date, a: Date, b: Date): boolean {
	const x = new Date(date).setHours(0,0,0,0),
		y = new Date(a).setHours(0,0,0,0),
		z = new Date(b).setHours(23,59,59,999);
	return x >= y && x < z;
}