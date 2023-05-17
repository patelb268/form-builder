import { Injectable } from '@angular/core';
import { CanLoad, CanActivate } from '@angular/router';
import { ApiService } from '@services/api.service';

@Injectable({
  providedIn: 'root'
})
export class UserGuard implements CanLoad, CanActivate {

	constructor(
		private _api: ApiService,
	) {}

	canLoad() {
		return this._api.isValidUser();
	}
	canActivate() {
		return this._api.isValidUser();
	}
}
