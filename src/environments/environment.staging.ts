import { EnvironmentConfig, version, systemEmail } from './_environment';

export const environment: EnvironmentConfig = {
	production: true,
	language: 'enCa',
	version,
	systemEmail,
	api: {
		autoAuthenticate: true,
		allowGuest: false,
		url: 'https://api.datalynk.ca:8080',
		// uploadUrl: 'https://api.datalynk.ca:8080/upload.php',
	},
};
