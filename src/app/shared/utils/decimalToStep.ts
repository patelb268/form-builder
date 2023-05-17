export function decimalToStep(places: number): number {
	return places ? parseFloat('0.' + [ ...new Array(places - 1).fill(0), 1].join('')) : 1;
}
