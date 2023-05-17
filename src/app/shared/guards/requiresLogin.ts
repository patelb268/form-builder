import { Injectable } from '@angular/core';
import { ApiService } from '../services/api.service';
import { AppService } from '../services/app.service';
import { Auth } from 'auxilium-connect';
import { map } from 'rxjs/operators';
import { TranslatePipe } from '../pipes/translate.pipe';
import { of } from 'rxjs';

@Injectable({
	providedIn: 'root'
  })
export abstract class RequiresLogin {

	constructor(
		private _api: ApiService,
		private _app: AppService,
	) { }

	protected requiresLogin(msg: string, assertFn: (auth: Auth) => boolean) {
		const auth = this._api.getCurrentAuth();
		if (!assertFn(auth)) {
			this._app.notify.warn(msg, 'x', {duration: 3000});
			return this._api
					.showLogin(null, assertFn, TranslatePipe.instance.transform('requires_admin_user'))
					.pipe(
						map(() => true),
					);
		}
		return of(true);
	}
}
