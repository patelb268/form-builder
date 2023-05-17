import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { AuthRow } from 'auxilium-connect';
import { of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { VerifySmsComponent, VerifySmsComponentParams } from 'src/app/shared/components/verify-sms/verify-sms.component';
import { AppService } from './app.service';
import { VerifyGoogleAuthenticatorComponent, VerifyGoogleAuthenticatorComponentParams } from '../components/verify-google-authenticator/verify-google-authenticator.component';
import { AccountResponse, BaseUpdateResponse, TWO_FACTOR_TYPES, AuthToUpdate, UPDATE_ERRORS } from './user.service.defs';


@Injectable({
	providedIn: 'root'
})
export class UserService {

	// private _updateableProperties: (keyof AuthRow)[] = ['first_name', 'last_name', 'email', 'login', '2FA', 'mobile_phone'];
	private _simpleProperties: (keyof AuthRow)[] = ['first_name', 'last_name', 'email', 'login'];

	constructor(
		private _api: ApiService,
		private _dialog: MatDialog,
		private _app: AppService,
	) { }

	getTimezone() {
		return this._api.getTimezone() || null;
	}

	account() {
		return this._api
			.request<AccountResponse>({'$/tools/do': [
				'auth', {'!/auth/current': {}},
				'timezones', {'!/tools/available_time_zones': {}},
				'all', {
					auth: {$_: 'auth'},
					timezones: {$_: 'timezones:rows'},
				},
			]}, {labelAs: 'user.account'})
			.pipe(
				map(r => {
					r.timezone = this._api.getTimezone();
					return r;
				})
			);
	}

	changePassword(user: number, password: string) {
		return this._api
			.request<{success: number, authId: number}>({'$/auth/changeUserPassword': {user, password}})
			.pipe(
				catchError(err => {
					return of({success: 0, authId: user});
				})
			);
	}

	// deactivate(authIds: number[]) {
	// 	return this._api
	// 		.updateRows('users', authIds.map(id => ({})))
	// }

	update(value: AuthToUpdate) {

		const tz = value.timezone || null;
		let afterValidateRequest: any,
			twoFactorBefore: TWO_FACTOR_TYPES;


		if (tz !== this.getTimezone() ) {
			this._api.setTimezone(tz);
		}

		return this._api
			.request<AuthRow>({'$/auth/current': {}}, {labelAs: 'user.update.precheck'})
			.pipe(
				switchMap(before => {
					twoFactorBefore = before['2FA'] as TWO_FACTOR_TYPES;
					const base: any = {
							id: before.id,
						},
						stack: any[] = [],
						twoFactorValue = value['2FA'],
						hasTwoFactorOptOut = !twoFactorValue && twoFactorBefore,
						phoneChanged = value.mobile_phone !== before.mobile_phone;// || (twoFactorValue === TWO_FACTOR_TYPES.SMS && twoFactorBefore !== twoFactorValue);

					// stage 1, save our core properties
					this._simpleProperties.forEach(prop => {
						if (value.hasOwnProperty(prop)) {
							base[prop] = value[prop];
						}
					});

					// there is a bug, where setting the timezone will cause this to return null
					stack.push('base', {'!/auth/update': {row: base}});

					// stage 2, did the mobile_phone change?  if so, send to it
					// OR, if 2fa was turned to SMS from a different value..
					if (phoneChanged) {
						if (value.mobile_phone) {
							stack.push('mobile', {'!/auth/mobile/generate': {phone: value.mobile_phone}});
						} else {
							base.mobile_phone = null;
						}
					}
					if (twoFactorValue) {
						if (twoFactorBefore !== twoFactorValue) {
							const avr = {'!/auth/multifactor/register': {method: twoFactorValue}};
							switch (twoFactorValue) {
								case TWO_FACTOR_TYPES.GOOGLE:
									stack.push('googleAuthenticator', {'!/auth/multifactor/generate': {}});
									break;
								case TWO_FACTOR_TYPES.SMS:
									if (phoneChanged) {
										afterValidateRequest = avr;
									} else {
										stack.push('afterUpdateRequest', avr);
									}
									break;
							}
						} else {
							console.log('no change to 2 factor');
						}
					}

					// are we changing the password also?
					if (value.password && value.newPassword) {
						// put this first, so it brings the whole stack down..
						stack.unshift('password', {'!/auth/changePassword': {current: value.password, password: value.newPassword}});
					}

					// opting out of multi/2fa?
					if (hasTwoFactorOptOut) {
						// put THIS before everything, including the password change..
						stack.unshift('optout', {'!/auth/multifactor/unroll': {password: value.password}});
					}

					// now, bring it all back in
					stack.push('authAfter', {'!/auth/current': {}}, 'all', {$_: '*'});
					return this._api
						.request<{
							base: BaseUpdateResponse;
							mobile?: any;
							googleAuthenticator?: {key: string, qrcode: string};
							afterUpdateRequest?: any,
							password?: {success: number, authId: number},
							optout?: {success: number},
							authAfter: AuthRow,
						}>({'$/tools/do': stack}, {labelAs: 'user.update.stack'})
						.pipe(
							catchError(err => {
								if (/current password/i.test(err)) {
									throw UPDATE_ERRORS.INVALID_PASSWORD;
								} else if (typeof err === 'string') {
									throw err;
								}
								throw UPDATE_ERRORS.UNKNOWN;
							}),
							map(resp => ({
								auth: resp.base.auth || Object.assign({}, before, base), // magically mix it back in...
								mobile: resp.mobile,
								googleAuthenticator: resp.googleAuthenticator,
								afterUpdateRequest: resp.afterUpdateRequest,
								password: 'password' in resp ? !!resp.password.success : null,
								optout: 'optout' in resp ? !!resp.optout.success : null,
								authAfter: resp.authAfter,
							})),
						);
				}),
				// alirght, at this point, we know if the base saved or not, and if there was a text message sent
				switchMap(r => {
					if (r.mobile) {
						return this._dialog
							.open(VerifySmsComponent, {
								data: {
									id: r.auth.id,
									mobile_phone: value.mobile_phone,
									afterValidateRequest,
								} as VerifySmsComponentParams,
								disableClose: true,
							})
							.afterClosed() // this resolves either true (in which case, the backend has saved the #, or false)
							.pipe(
								map(validated => {
									if (validated) {
										r.auth.mobile_phone = value.mobile_phone;
										r.auth.smsValidated = true;
									} else {
										r.auth.smsValidated = false;
									}
									return r.auth;
								})
							);
					} else if (r.googleAuthenticator) {
						return this._dialog
							.open(VerifyGoogleAuthenticatorComponent, {
								data: {
									key: r.googleAuthenticator.key,
									qrcode: r.googleAuthenticator.qrcode,
									afterValidateRequest,
								} as VerifyGoogleAuthenticatorComponentParams,
								disableClose: true,
							})
							.afterClosed()
							.pipe(
								map(validated => {
									if (validated) {
										r.auth.googleAuthenticatorValidated = true;
									} else {
										r.auth.googleAuthenticatorValidated = false;
										r.auth['2FA'] = twoFactorBefore || TWO_FACTOR_TYPES.NONE;
									}
									return r.auth;
								})
							)
					} else {
						if (!r.auth) {
							r.auth = r.authAfter;
						}
						r.auth['2FA'] = r.authAfter['2FA']; // ensure it hasn't been automagically verified
						return of(r.auth);
					}
				})
			);

	}
}
