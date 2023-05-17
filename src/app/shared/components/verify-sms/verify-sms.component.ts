import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiService } from '@services/api.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AppService } from '@services/app.service';
import { of } from 'rxjs';
import { catchError, filter } from 'rxjs/operators';

export interface VerifySmsComponentParams {
	mobile_phone: string;
	afterValidateRequest?: any;
}

@Component({
	selector: 'app-verify-sms',
	templateUrl: './verify-sms.component.html',
	styleUrls: ['./verify-sms.component.scss'],
	
})
export class VerifySmsComponent implements OnInit {

	form = new FormGroup({
		pin: new FormControl('', [Validators.required]),
	});

	constructor(
		@Inject(MAT_DIALOG_DATA) public data: VerifySmsComponentParams,
		private _api: ApiService, // i don't like this here, but trying to avoid circular references
		public app: AppService,
		private _dialog: MatDialogRef<VerifySmsComponent>,
	) { }

	ngOnInit(): void {
		console.log(this.data);
	}

	onSubmit() {

		this.form.disable();

		this._api
			.request<{
				verify: {success: number};
				afterValidateRequest?: any;
			}>({'$/tools/do': [
				'verify', {'!/auth/mobile/verify': {
					pin: this.form.value?.pin,
				}},
				'afterValidateRequest', this.data.afterValidateRequest || {},
				'all', {$_: '*'}
			]})
			.pipe(
				catchError(err => {
					this.app.notify.warn('2FA_invalid_code');
					this.form.enable();
					return of({verify: {success: 0}});
				}),
				filter(r => !!(r?.verify?.success))
			)
			.subscribe(() => this._close(true));
	}

	private _close(returnValue: boolean) {
		this.app.notify.dismiss();
		this._dialog.close(returnValue);
	}

}
