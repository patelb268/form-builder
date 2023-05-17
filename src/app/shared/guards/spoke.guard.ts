import { Injectable } from '@angular/core';
import { CanActivate, CanLoad, Route, ActivatedRouteSnapshot } from '@angular/router';
import { ApiService } from '@services/api.service';

@Injectable({
  	providedIn: 'root'
})
export class SpokeGuard implements CanActivate, CanLoad {
	constructor(
		private _api: ApiService,
	) { }

	canActivate(next: ActivatedRouteSnapshot) {
		return this._check(next.data.spoke);
	}

	canLoad(route: Route) {
		return this._check(route.data.spoke);
	}

	private _check(spoke: string) {
		if (!spoke) {
			console.warn('ensure you pass the guard the data: {spoke: string}');
			return false;
		} else {
			return spoke === this._api.spoke;
		}
	}

}
