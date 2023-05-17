import { Injectable } from '@angular/core';
import { defer, from, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

@Injectable({
 	providedIn: 'root'
})
export class FetchService {

	static instance: FetchService;

	constructor() {
		if (!FetchService.instance) {
			FetchService.instance = this;
			console.log('instanced');
		}
	}

	getJson<T>(url: string, req: RequestInit = {}, resolveOnError?: T) {
		return this._fetch(url, req, resolveOnError)
			.pipe(
				switchMap(resp => {
					if ((<Response>resp).json) {
						const prom = (<Response>resp).json() as any as Promise<T>;
						return from(prom);
					} else {
						return of(resolveOnError);
					}
				})
			);
	}

	private _fetch<E>(url: string, req: RequestInit = {}, resolveOnError?: E) {
		return defer(
			() => fetch(url, req),
		)
		.pipe(
			catchError(err => {
				console.warn('error fetching resource', err);
				return of<E>(resolveOnError)
			}),
		)
	}
}
