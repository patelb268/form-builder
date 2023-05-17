import { Component, OnInit, ChangeDetectionStrategy, Inject, ViewChild } from '@angular/core';
import { UserService } from '@services/user.service';
import { FormGroup, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatTooltip } from '@angular/material/tooltip';
import { AppService } from '@services/app.service';
import { AuthRow } from 'auxilium-connect';

@Component({
	selector: 'app-change-password',
	templateUrl: './change-password.component.html',
	styleUrls: ['./change-password.component.scss'],
})
export class ChangePasswordComponent implements OnInit {

	form = new FormGroup({
		password: new FormControl(this._generatePassword()),
	});
	@ViewChild('tooltip', {read: MatTooltip, static: true}) tooltip: MatTooltip;

	constructor(
		private _users: UserService,
		@Inject(MAT_DIALOG_DATA) public auth: AuthRow,
		private _clip: Clipboard,
		public app: AppService,
		private _ref: MatDialogRef<ChangePasswordComponent>,
	) { }

	submit() {
		const form = this.form,
			value = form.value,
			auth = this.auth,
			password: string = value?.password,
			email = auth.email,
			authId = auth.id;

		if (authId && password) {
			form.disable();
			this._users
				.changePassword(authId, password)
				.subscribe(r => {
					if (r.success) {
						this.app.notify.success('password_changed_succesfully');
						this._ref.close({expire_password: null});
					} else {
						form.enable();
						this.app.notify.warn('error_changing_password');
					}
				})

		}

		console.log('submit called', {password, email, authId});
	}

	copy(evt: any) {
		const p: string = this.form?.value?.password,
			tt = this.tooltip;
		if (p) {
			this._clip.copy(p);
			this.app.notify.success('copied_to_clipboard')
		}
	}

	ngOnInit(): void {
	}

	generate() {
		this.form.get('password').setValue(this._generatePassword());
	}

	private _generatePassword() {
		return Math.random().toString(36).slice(-8);
	}

}
