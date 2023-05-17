export function isObjectOrArray(obj: any): boolean {
	if (obj) {
		switch (Object.prototype.toString.call(obj)) {
			case '[object Object]':
			case '[object Array]':
				return true;
		}
	}
	return false;
}
