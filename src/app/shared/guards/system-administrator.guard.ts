import { Injectable } from '@angular/core';
import { CanLoad, CanActivate } from '@angular/router';
import { Auth } from 'auxilium-connect';
import { RequiresLogin } from './requiresLogin';

@Injectable({
  providedIn: 'root'
})
export class SystemAdministratorGuard extends RequiresLogin implements CanLoad, CanActivate {

	canLoad() {
		return this._can();
	}
	canActivate() {
		return this._can();
	}

	assert(auth: Auth) {
		return !!(auth?.admin?.system);
	}

	private _can() {
		return this.requiresLogin('requires_sysadmin_user', this.assert);
	}
}
