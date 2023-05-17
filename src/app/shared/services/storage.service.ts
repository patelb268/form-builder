import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
	providedIn: 'root'
})
export class StorageService {

	constructor(
		private _api: ApiService,
	) { }

	get<T>(key: string, session = false): T {
		key = this._makeKey(key);
		const store = session ? sessionStorage : localStorage,
			val = store.getItem(key);
		try {
			return JSON.parse(val) as T || null;
		} catch (err) {
			// return val as T || null;
		}
		return null;
	}

	set<T>(key: string, value: T, session = false): void {
		key = this._makeKey(key);
		const store = session ? sessionStorage : localStorage;
		let encoded: string;
		if (typeof value !== 'string') {
			try {
				encoded = JSON.stringify(value);
			} catch (err) {
				encoded = '' + value;
			}
			store.setItem(key, encoded);
		} else {
			store.setItem(key, value);
		}
	}

	remove(key: string, session = false) {
		key = this._makeKey(key);
		const store = session ? sessionStorage : localStorage;
		store.removeItem(key);
	}

	private _makeKey(key: string) {
		return `${this._api.spoke}-${key}`;
	}
}
