export class JsonSerializeable<T> {

	constructor(
		params?: T | string,
	) {
		if (params) {
			if (typeof params === 'string') {
				this.fromJSON(params);
			} else {
				this._fromJSON(params);
			}
		}
	}

	public fromJSON(data: string) {
		return this._fromJSON(JSON.parse(data));
	}

	public toJSON() {
		const ret: any = {};
		Object.keys(this)
			.forEach(key => ret[key] = this[key]);
		return JSON.stringify(ret);
	}

	private _fromJSON(data: T) {
		Object.keys(data)
			.filter(key => data.hasOwnProperty(key))
			.forEach(key => this[key] = data[key]);
	}

}
