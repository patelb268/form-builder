// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { EnvironmentConfig, systemEmail, version } from "./_environment";

export const environment: EnvironmentConfig = {
	production: false,
	version,
	systemEmail,
	language: "enCa",
	api: {
		autoAuthenticate: true,
		allowGuest: false,

		// uploadUrl: `http://api/upload`,
		// url: `https://api.datalynk.ca:8080`,
		// url: `http://api`,
		url: "https://api.datalynk.ca",
		spoke: "sandbox",
	},
};
