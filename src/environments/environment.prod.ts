import { EnvironmentConfig, version, systemEmail } from './_environment';

export const environment: EnvironmentConfig = {
	production: true,
	language: 'enCa',
	version,
	systemEmail,
	api: {
		autoAuthenticate: true,
		allowGuest: true,
	},
};
