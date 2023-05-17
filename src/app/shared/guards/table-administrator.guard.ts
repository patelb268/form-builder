import { Injectable } from '@angular/core';
import { CanLoad, CanActivate } from '@angular/router';
import { ApiService } from '@services/api.service';

@Injectable({
  providedIn: 'root'
})
export class TableAdministratorGuard implements CanLoad, CanActivate {

	constructor(
		private _api: ApiService,
	) {}

	canLoad() {
		return this._api.isTableAdmin();
	}
	canActivate() {
		return this._api.isTableAdmin();
	}
}
