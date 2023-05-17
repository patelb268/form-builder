import { Component, OnInit, ChangeDetectionStrategy, Input, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppService } from '@services/app.service';
import { takeWhile, map, filter } from 'rxjs/operators';
import { UserAdminService, AuthHistoryRow } from 'src/app/admin/services/user-admin.service';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { SliceRow } from 'src/app/shared/models/slice';
import { LegacyActionsService } from '@services/legacy-actions.service';
import { TWO_FACTOR_TYPES } from '@services/user.service.defs';
import { PhoneNumberValidator } from 'src/app/shared/validators/phoneNumber.validator';
import { AuthRow } from 'auxilium-connect';
import { Subject, ReplaySubject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ChangePasswordComponent } from '../change-password/change-password.component';

// http://sandbox.datalynk:4200/admin/users/186953

@Component({
	selector: 'app-auth-editor',
	templateUrl: './auth-editor.component.html',
	styleUrls: ['./auth-editor.component.scss'],
})
export class AuthEditorComponent implements OnInit, OnDestroy {

	private _destroyed = false;
	private _id: number;
	private _mobileValidator = PhoneNumberValidator();
	private _sessions = new Subject<AuthHistoryRow[]>();

	@Input() set id(id: number) {
		if (id !== this._id) {
			this._id = id;
			this._load(id);
		}
	} get id() { return this._id; }

	active = false;
	activeSessions = this._sessions.pipe(map(rows => rows.filter(s => !s.cancel && s.expire >= new Date())));
	form = new UntypedFormGroup({
		active: new UntypedFormControl(true),
		first_name: new UntypedFormControl(),
		last_name: new UntypedFormControl(),
		email: new UntypedFormControl('', [Validators.email]),
		login: new UntypedFormControl(),
		mobile_phone: new UntypedFormControl(),
		'2FA': new UntypedFormControl({value: '', disabled: true}),
		sysadmin: new UntypedFormControl(),
		roles: new UntypedFormControl([]),
		expire_password: new UntypedFormControl(),
	});
	required = {
		mobile_phone: false,
	};
	roles: SliceRow[];
	sessionHistory = this._sessions.pipe(map(rows => rows.filter(s => s.cancel || s.expire <= new Date())));
	showAllRoles = false;
	TYPES = TWO_FACTOR_TYPES;
	userAgent = navigator.userAgent;
	userAgentProps = ['browser', 'os', 'device'];
	working = new ReplaySubject<boolean>(1);

	constructor(
		public app: AppService,
		private _route: ActivatedRoute,
		private _cd: ChangeDetectorRef,
		private _users: UserAdminService,
		private _router: Router,
		public legacy: LegacyActionsService,
		private _dialog: MatDialog,
	) { }

	ngOnDestroy() {
		this._destroyed = true;
	}

	ngOnInit(): void {

		const form = this.form,
			multi = form.get('2FA');

		this._route.paramMap
			.pipe(
				takeWhile(() => !this._destroyed),
			)
			.subscribe(params => {
				this.id = +params.get('id') || this.id;
			});

		// if 2fa changes, we need to alter the mobile_phone validation
		multi.valueChanges
			.pipe(takeWhile(() => !this._destroyed))
			.subscribe(v => this._onMultiChange(v));

		this.working
			.pipe(
				takeWhile(() => !this._destroyed)
			)
			.subscribe(working => working ? this.form?.disable() : this.form?.enable());
	}

	assume() {

		this.app.notify.dismiss();

		this._users
			.assume(this.id)
			.subscribe(good => {
				if (!good) {
					this.app.notify.warn('error_assuming_user');
				} else {
					this._router.navigateByUrl('/');
				}
			});
	}

	canActivate() {
		return !!(this._users.canAdminUser() && !this.form?.get('active').value);
	}
	canAssume() { return this._users.canAssumeUser(this.id); }
	canDeactivate() {
		return !!(this._users.canAdminUser() && this.form?.get('active').value);
	}
	canExpirePassword() {
		const d = this.form?.get('expire_password').value as Date,
			now = new Date();
		return this._users.canExpirePassword(this.id) && !d || d > now;
	}
	canResetPassword() { return this._users.canAdminUser(); }
	canUnexpirePassword() {
		const d = this.form?.get('expire_password').value as Date;
		return !!(this._users.canExpirePassword(this.id) && d);
	}

	changePassword() {
		const email = this.form?.get('email')?.value;
		this._dialog
			.open(ChangePasswordComponent, {
				data: {id: this.id, email},
				disableClose: true,
			})
			.afterClosed()
			.pipe(
				filter(r => !!r)
			)
			.subscribe(mixBack => {
				Object.entries(mixBack)
					.forEach(([key, val]) => {
						const c = this.form.get(key);
						console.log('mux', {key, val, c});
						if (c) {
							c.setValue(val);
							c.markAsPristine();
						}
					})
					this.form.updateValueAndValidity();
			});
	}


	expirePassword() {
		this.working.next(true);
		this._users
			.expirePassword([this.id])
			.pipe(takeWhile(() => !this._destroyed))
			.subscribe(date => {
				this.working.next(false);
				if (!date) {
					this.app.notify.warn('error_expire_password');
				} else {
					this.app.notify.success('success_expire_password');
					this.form.get('expire_password')?.setValue(date);
				}
			});
	}

	expireSession(row: AuthHistoryRow) {
		this._users
			.expireSession(row.guid)
			.pipe(
				takeWhile(() => !this._destroyed),
			)
			.subscribe(resp => {
				console.log('expired', resp);
			});
	}

	unexpirePassword() {
		this.working.next(true);
		this._users
			.unexpirePassword([this.id])
			.pipe(takeWhile(() => !this._destroyed))
			.subscribe(r => {
				this.working.next(false);
				if (!r.success) {
					this.app.notify.warn('error_unexpire_password');
				} else {
					this.app.notify.success('success_unexpire_password');
					this.form.get('expire_password')?.setValue(null);
				}
			});
	}

	onRoleChange(checked: boolean, sliceId: number) {
		const control = this.form.get('roles'),
			val: number[] = control.value || [],
			existing = val.indexOf(sliceId);
		if (checked && existing === -1) {
			val.push(sliceId);
		} else if (!checked && existing > -1) {
			val.splice(existing, 1);
		}
		console.log('after...', control.value, {checked, sliceId});
	}

	private _load(id: number) {
		this.working.next(true);
		this._users
			.userProfile(id)
			.subscribe(r => {
				const f = this.form,
					auth = r.auth,
					update = r.auth._updatable,
					formValue = Object.assign({}, auth, {roles: r.membership || []});

				['active', 'sysadmin']
					.forEach(prop => {
						if (r.user._updatable.has(prop)) {
							update.add(prop);
						}
						formValue[prop] = !!r.user[prop];
					});

				f.patchValue(formValue);
				console.log('patched', formValue);
				f.markAsPristine();
				f.updateValueAndValidity();

				this._toggleWritable(update, auth);

				this.roles = r.roles;

				this._sessions.next(r.sessions || []);

				this.working.next(false);
				this._cd.detectChanges();

			});
	}


	private _onMultiChange(v: TWO_FACTOR_TYPES) {
		const required = v === TWO_FACTOR_TYPES.SMS,
			mobile = this.form.get('mobile_phone');
		if (required) {
			mobile.setValidators([Validators.required, this._mobileValidator]);
		} else {
			mobile.setValidators([this._mobileValidator]);
		}
		this.required.mobile_phone = required;
	}

	private _toggleWritable(writable: Set<string>, auth?: AuthRow) {
		Object
			.entries(this.form.controls)
			.forEach(([key, control]) => {
				// tslint:disable-next-line: curly
				if (key === 'roles') return;
				if (writable.has(key)) {
					control.enable();
				} else {
					control.disable();
				}
			});

		// ensure we cant touch anything on ourself that may get us in trouble
		if (auth.id === this.app.getCurrentAuth()?.id) {
			this.form.get('sysadmin').disable();
		}

	}
}
