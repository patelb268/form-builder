import { AuthRow } from 'auxilium-connect';

export interface AccountResponse {
	auth: AuthRow;
	timezones: TimezoneRow[];
	timezone?: string;
}

export type TimezoneRow = string;

export enum TWO_FACTOR_TYPES {
	NONE = '',
	SMS = 'SMS',
	GOOGLE = 'GOOGLE_AUTHENTICATOR',
}

export interface AuthRowUpdated extends AuthRow {
	smsValidated?: boolean;
	googleAuthenticatorValidated?: boolean;
}

export interface BaseUpdateResponse {
	auth: AuthRowUpdated;
}

export interface AuthToUpdate extends AuthRow {
	password?: string;
	newPassword?: string;
	timezone?: string;
}

export enum UPDATE_ERRORS {
	UNKNOWN = 'error_unknown',
	INVALID_PASSWORD = 'error_invalid_password',
}
