import { ApiConfig } from 'auxilium-connect';
import { LanguageDef } from 'src/app/shared/pipes/translate.pipe';


export interface EnvironmentConfig {
	production: boolean;
	systemEmail: string;
	version: string;
	api?: ApiConfig;
	language?: keyof LanguageDef;
	socket?: string;
}



export const version = require('../../package.json').version as string;

export const systemEmail = 'no-reply@auxiliumgroup.com';
