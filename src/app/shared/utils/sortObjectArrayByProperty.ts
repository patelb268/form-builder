type SortFn = <T>(a: T, b: T) => number;

const _CACHE = new Map<string, SortFn>();

export function sortObjectArrayByProperty<T>(prop: string) {
	const c = _CACHE;
	let fn = c.get(prop);
	if (!fn) {
		c.set(prop, fn = (a, b) => {
			const x = ((a[prop] || '') + '').toLowerCase(),
				y = ((b[prop] || '') + '').toLowerCase();
			return x < y ? -1 : x > y ? 1 : 0;
		});
	}
	return fn;
}
