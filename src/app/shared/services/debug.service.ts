import { Injectable } from '@angular/core';
import { combineLatest } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class DebugService {

	constructor(
		private _api: ApiService,
		private _router: Router,
	) {
		if (!window.appDebug) {
			window.appDebug = this;
		}
	}

	print() {
		this.all()
			.pipe(take(1))
			.subscribe(r => console.info(r));
	}

	all() {
		const api = this._api;
		return combineLatest([
			api.auth,
		])
		.pipe(
			map(([auth]) => ({
				auth: Object.assign({token: api.getToken()}, auth),
				api: {
					spoke: api.spoke,
					url: api.url,
					uploadUrl: api.uploadUrl,
					token: api.getToken(),
				},
				route: this._router.url,
				viewport: this.viewport,
				navigator: this.navigator,
			})),
		);
	}

	get navigator() {
		const ret: any = {};
		const n = navigator;
		for (const key in n) {
			if (n.hasOwnProperty(key)) {
				ret[key] = n[key];
			}
		}
		return ret;
	}

	get viewport() {
		return {
			innerWidth,
			innerHeight,
			outerWidth,
			outerHeight,
		};
	}

}
