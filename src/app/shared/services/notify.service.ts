import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { TranslatePipe } from '../pipes/translate.pipe';

@Injectable({
  providedIn: 'root'
})
export class NotifyService {

	constructor(
		private _snack: MatSnackBar,
		private _trans: TranslatePipe,
	) {	}

	warn(message: string, action: string = 'ok', config: MatSnackBarConfig = {}, translate: any = true) {
		if (!config.panelClass) { config.panelClass = ['warn']; }
		if (!config.hasOwnProperty('duration')) { config.duration = 30000; }
		return this._notify(message, action, config, translate);
	}

	success(message: string, action?: string, config: MatSnackBarConfig = {}, translate: any = true) {
		if (!config.panelClass) { config.panelClass = ['bg-success', 'text-white', 'c-margin']; }
		if (!config.hasOwnProperty('duration')) { config.duration = 3000; config.horizontalPosition = 'right', config.verticalPosition = 'bottom' }
		return this._notify(message, action, config, translate);
	}

	successForReplace(message: string, action?: string, config: MatSnackBarConfig = {}, translate: any = true) {
		if (!config.panelClass) { config.panelClass = ['bg-success', 'text-white'];  }
		if (!config.hasOwnProperty('duration')) { config.duration = 30000;  }
		return this._notify(message, action, config, translate);
	}

	inform(message: string, action?: string, config: MatSnackBarConfig = {}, translate: any = true) {
		if (!config.panelClass) { config.panelClass = ['warn']; }
		if (!config.hasOwnProperty('duration')) { config.duration = 1000000; config.horizontalPosition = 'center', config.verticalPosition = 'top' }
		return this._notify(message, 'close', config, translate);
	}

	informNew(message: string, action?: string, config: MatSnackBarConfig = {}, translate: any = true) {
		if (!config.panelClass) {  config.panelClass = ['light-grey']; }
		if (!config.hasOwnProperty('duration')) { config.duration = 60000; config.horizontalPosition = 'center', config.verticalPosition = 'top' }
		return this._notify(message, 'close', config, translate);
	}

	dismiss() {
		return this._snack.dismiss();
	}

	private _notify(message: string, action = '', config: MatSnackBarConfig = {}, translate: any = true) {
		const transObj = !!translate ? typeof translate === 'boolean' ? {} : translate : null;
		if (translate) {
			message = this._translate(message, transObj);
			action = this._translate(action);
		}
		if (!config.panelClass) { config.panelClass = ['primary']; }
		return this._snack.open(message, action, config);
	}

	private _translate(text: string, obj?: any) {
		// console.log('what?')
		return this._trans.transform(text, obj);
	}
}
