import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { AppService } from '@services/app.service';
import { Observable, combineLatest, ReplaySubject, of } from 'rxjs';
import { Auth, AuthRow } from 'auxilium-connect';
import { UntypedFormControl, Validators, UntypedFormGroup, AbstractControl } from '@angular/forms';
import { takeWhile, switchMap, tap, catchError } from 'rxjs/operators';
import { UserService } from '@services/user.service';
import { PhoneNumberValidator } from 'src/app/shared/validators/phoneNumber.validator';
import { TWO_FACTOR_TYPES, AccountResponse, AuthToUpdate, UPDATE_ERRORS, AuthRowUpdated, TimezoneRow } from '@services/user.service.defs';
import { TranslatePipe } from 'src/app/shared/pipes/translate.pipe';

@Component({
	selector: 'app-settings-profile',
	templateUrl: './profile.component.html',
	styleUrls: ['./profile.component.scss'],
	
})
export class ProfileComponent implements OnInit, OnDestroy {

	auth: Observable<Auth>;
	error: string;
	form = new UntypedFormGroup({
		first_name: new UntypedFormControl(null, [Validators.required]),
		last_name: new UntypedFormControl(null, [Validators.required]),
		email: new UntypedFormControl(null, [Validators.email]),
		login: new UntypedFormControl(),
		// timezone: new FormControl(null),
		mobile_phone: new UntypedFormControl(null), // phone validator will be set internally
		'2FA': new UntypedFormControl(),
		password_existing: new UntypedFormControl(),
		password_new: new UntypedFormControl(),
		password_confirm: new UntypedFormControl('', [this._confirmValidator.bind(this)]),
		timezone: new UntypedFormControl(''),
	}, {
		// validators: [this._formValidator.bind(this)]
	});
	loading = new ReplaySubject<boolean>(1);
	timezones: {value: string, label: string}[] = [];
	TYPES = TWO_FACTOR_TYPES;
	required = {
		login: false,
		email: false,
		mobile_phone: false,
		passExist: false,
		passNew: false,
		passConfirm: false,
		passForMultiFactor: false,
	};
	systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	multifactorConfirmed = false;

	private _destroyed = false;
	private _mobileValidator = PhoneNumberValidator();

	constructor(
		public app: AppService,
		private _users: UserService,
		private _cd: ChangeDetectorRef
	) { }

	get value() {
		const form = this.form,
			raw = form.getRawValue(),
			row: AuthToUpdate = raw;

		row['2FA'] = row['2FA'] || null;
		row.email = row.email || null;
		row.login = row.login || null;

		if (form.valid && raw.password_new && raw.password_existing && raw.password_new === raw.password_confirm) {
			row.newPassword = raw.password_new;
		}
		row.password = raw.password_existing;

		return row;
	}

	ngOnDestroy() {
		this._destroyed = true;
		console.warn('DESTROYED!');
	}

	ngOnInit(): void {

		const form = this.form;

		this.app.auth
			.pipe(
				tap(() => this.loading.next(true)),
				takeWhile(() => !this._destroyed),
				switchMap(auth => this._users.account())
			)
			.subscribe(auth => this._load(auth));

		form.get('2FA').valueChanges
			.pipe(
				takeWhile(() => !this._destroyed),
			)
			.subscribe(type => this._updateMultifactorValidators(type));

		combineLatest([
			form.get('email').valueChanges,
			form.get('login').valueChanges,
		])
		.pipe(
			takeWhile(() => !this._destroyed),
		)
		.subscribe(([email, login]) => this._updateEmailLoginValidators(email, login));

		combineLatest([
			form.get('password_existing').valueChanges,
			form.get('password_new').valueChanges,
			form.get('password_confirm').valueChanges,
		])
		.pipe(
			takeWhile(() => !this._destroyed),
		)
		.subscribe(([e, n, c]) => this._updatePasswordValidators(n));
	}

	onSubmit() {
		const form = this.form,
			row = this.value;

		if (form.invalid) {
			return;
		}

		form.disable();
		this._users
			.update(row)
			.pipe(
				catchError((code: string) => {
					this.app.notify.warn(code);
					return of<AuthRowUpdated>(null);
				}),
			)
			.subscribe(resp => {
				if (resp) {

					const nowRequiresMulti = !!(resp['2FA']);

					form.patchValue({
						password_existing: null,
						password_new: null,
						password_confirm: null,
					}, {emitEvent: false});

					if ('smsValidated' in resp && !resp.smsValidated) {
						const mobile = form.get('mobile_phone');
						mobile.setValue(resp.mobile_phone);
						mobile.markAsPristine();
						mobile.updateValueAndValidity();
						form.updateValueAndValidity();
						this.app.notify.warn('mobile_phone_number_has_been_reset');
					} else if ('googleAuthenticatorValidated' in resp && !resp.googleAuthenticatorValidated) {
						const twoFactor = form.get('2FA');
						twoFactor.setValue(resp['2FA']);
						twoFactor.markAsPristine();
						twoFactor.updateValueAndValidity();
						form.updateValueAndValidity();
						this.app.notify.warn('2FA_has_been_reset');
					} else {
						this.app.notify.success('profile_changes_saved');
						form.markAsPristine();
						form.updateValueAndValidity();
					}

					this.multifactorConfirmed = nowRequiresMulti;
					this._afterValidatorsUpdate();
				}

				form.enable();
			});
	}

	getErrorMessage(name: string) {
		const c = this.form?.get(name),
			trans = TranslatePipe.instance;
		if (c?.errors) {
			return Object
				.entries(c.errors)
				.map(([key, obj]) => trans.transform(`form_validation_fail_${key}`, obj || {}))
				.shift();
		} else {
			return null;
		}
	}

	// private _saveWithSmsConfirm(value: FormValue) {
	// 	return this._users.updateWithSms2Factor({
	// 			id: null, // for compatibility
	// 			first_name: value.first_name || null,
	// 			last_name: value.last_name || null,
	// 			email: value.email || null,
	// 			login: value.login || null,
	// 		});
	// }
	// private _saveNoConfirm(value: FormValue) {
	// 	return this._users.update({
	// 		id: null,
	// 		first_name: value.first_name || null,
	// 		last_name: value.last_name || null,
	// 		email: value.email || null,
	// 		login: value.login || null,
	// 		mobile_phone: value.mobile_phone || null,
	// 	});
	// }

	// this runs after the custom validators are processed, as a safety measure,
	// and making it easier for us to do some last minute checks on things
	private _afterValidatorsUpdate() {

		const form = this.form,
			raw = form.getRawValue(),
			pass = form.get('password_existing'),
			req = this.required,
			multifactorConfirmed = this.multifactorConfirmed,
			opts = {
				emitEvent: false
			};

		if (multifactorConfirmed) {

			if (!raw['2FA']) {
				req.passForMultiFactor = true;
				pass.setValidators([Validators.required]);
				pass.markAsTouched();
			} else {
				req.passForMultiFactor = false;
				if (!req.passExist) {
					pass.clearValidators();
				}
			}
			pass.updateValueAndValidity(opts);

		} else if (req.passForMultiFactor) {
			req.passForMultiFactor = false;
		}
	}

	private _updateEmailLoginValidators(emailValue: string, loginValue: string) {

		const form = this.form,
			email = form.get('email'),
			login = form.get('login'),
			req = this.required,
			opts = {
				emitEvent: false,
			};

		if (!emailValue && !loginValue) {
			email.setValidators([Validators.required, Validators.email]);
			login.setValidators([Validators.required]);
			req.email = true;
			req.login = true;
			email.markAsTouched();
			login.markAsTouched();
		} else {
			email.setValidators([Validators.email]);
			login.clearValidators();
			req.email = false;
			req.login = false;
		}
		email.updateValueAndValidity(opts);
		login.updateValueAndValidity(opts);

		this._afterValidatorsUpdate();
	}

	private _updateMultifactorValidators(type: TWO_FACTOR_TYPES) {
		const f = this.form,
			req = this.required,
			mobile = f.get('mobile_phone');
		if (!!type) {
			switch (type) {
				case TWO_FACTOR_TYPES.SMS:
					mobile.setValidators([Validators.required, this._mobileValidator]);
					mobile.markAsTouched();
					req.mobile_phone = true;
					break;
				case TWO_FACTOR_TYPES.GOOGLE:
					req.mobile_phone = false;
					mobile.setValidators([this._mobileValidator]);
			}
		} else {
			mobile.setValidators([this._mobileValidator]);
			req.mobile_phone = false;
		}

		mobile.updateValueAndValidity();
		this._afterValidatorsUpdate();
	}

	private _updatePasswordValidators(password: string) {

		const f = this.form,
			e = f.get('password_existing'),
			c = f.get('password_confirm'),
			required = Validators.required,
			opts = {emitEvent: false};

		if (password) {
			e.setValidators([required]);
			c.setValidators([required, this._confirmValidator.bind(this)]);
		} else {
			e.clearValidators();
			c.clearValidators();
		}

		e.updateValueAndValidity(opts);
		c.updateValueAndValidity(opts);

		this._afterValidatorsUpdate();

	}

	private _confirmValidator(c: AbstractControl) {
		const v = this.form?.value?.password_new;
		return v === c.value ? null : {passwords_dont_match: true};
	}

	private _load(data: AccountResponse) {

		const form = this.form,
			auth = data.auth;

		this.loading.next(false);

		if (auth.guest) {
			this.error = 'error_guest_permission_denied';
			this._cd.detectChanges();
			return;
		}

		this.error = null;
		this.timezones = [ ...(data.timezones || []).map(tz => ({value: tz, label: tz}))];
		form.setValue({
			first_name: auth.first_name,
			last_name: auth.last_name,
			email: auth.email,
			login: auth.login,
			mobile_phone: auth.mobile_phone,
			'2FA': auth['2FA'] || TWO_FACTOR_TYPES.NONE,
			password_existing: '',
			password_new: '',
			password_confirm: '',
			timezone: data.timezone, // @@TODO
		});

		this.multifactorConfirmed = !!(auth['2FA']);
		console.log('multifactorConfirmed', this.multifactorConfirmed);

		form.markAsPristine();
		form.updateValueAndValidity();

	}

}
