import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { ApiService } from '@services/api.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { AppService } from '@services/app.service';
import { TWO_FACTOR_TYPES } from '@services/user.service.defs';
import { catchError, filter } from 'rxjs/operators';
import { of } from 'rxjs';

export interface VerifyGoogleAuthenticatorComponentParams {
	key: string;
	qrcode: string;
}

interface RegisterResponse {
	affected: number;
	tx: number;
	id: number;
}

@Component({
	selector: 'app-verify-google-authenticator',
	templateUrl: './verify-google-authenticator.component.html',
	styleUrls: ['./verify-google-authenticator.component.scss'],
	
})
export class VerifyGoogleAuthenticatorComponent implements OnInit {

	form = new FormGroup({
		code: new FormControl('', [Validators.required]),
	});

	constructor(
		@Inject(MAT_DIALOG_DATA) public data: VerifyGoogleAuthenticatorComponentParams,
		private _api: ApiService,
		private _dialog: MatDialogRef<VerifyGoogleAuthenticatorComponent>,
		public app: AppService,
	) { }

	ngOnInit(): void {

	}

	onSubmit() {
		const code = this.form.value.code;

		this.form.disable();

		this._api
			.request<RegisterResponse>({'$/auth/multifactor/register': {method: TWO_FACTOR_TYPES.GOOGLE, secret: code}})
			.pipe(
				catchError(err => {
					this.app.notify.warn('error_invalid_google_authenticator_code');
					this.form.enable();
					return of<RegisterResponse>(null);
				}),
				filter(r => !!(r && r?.affected))
			)
			.subscribe(() => this._close(true));
	}

	private _close(returnValue: boolean) {
		this.app.notify.dismiss();
		this._dialog.close(returnValue);
	}
}
