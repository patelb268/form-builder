import { Injectable } from '@angular/core';
import { CanLoad, CanActivate } from '@angular/router';
import { Auth } from 'auxilium-connect';
import { RequiresLogin } from './requiresLogin';

@Injectable({
  providedIn: 'root'
})
export class UserAdministratorGuard extends RequiresLogin implements CanLoad, CanActivate {

	canLoad() {
		return this._can();
	}
	canActivate() {
		return this._can();
	}

	assert(auth: Auth) {
		return !!(auth?.admin?.system || auth?.admin?.user);
	}

	private _can() {
		return this.requiresLogin('requires_admin_user', this.assert);
	}

}
