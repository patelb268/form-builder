import { Injectable } from '@angular/core';
import { AppService } from './app.service';
import { MatSnackBarConfig } from '@angular/material/snack-bar';

export interface NotifyAction {
	type: 'notify';
	method: 'warn' | 'success' | 'inform';
	message: string;
	translate?: boolean;
	action?: string;
	config?: MatSnackBarConfig;
}

export type CloseNavAction = 'closeNav';

export type Action =
	NotifyAction
	| CloseNavAction
;





@Injectable({
	providedIn: 'root'
})
export class ActionsService {

	constructor(
		private _app: AppService,
	) {

	}

	// this handles the delegation
	processAction(a: Action): void {
		if (typeof a === 'string') {
			switch (a) {
				case 'closeNav':
					return this._closeNav();
			}
		} else {
			switch (a.type) {
				case 'notify':
					return this._notify(a);
			}
		}
		console.warn('unhandled action', a);
	}

	private _closeNav() {
		this._app.leftNav.close();
	}

	private _notify(a: NotifyAction) {
		const n = this._app.notify;
		switch (a.method) {
			case 'inform':
				n.inform(a.message, a.action, a.config, a.translate);
				break;
			case 'success':
				n.success(a.message, a.action, a.config, a.translate);
				break;
			case 'warn':
				n.warn(a.message, a.action, a.config, a.translate);
				break;
			default:
				console.warn('unsupported notify action', {a});
		}
	}
}
