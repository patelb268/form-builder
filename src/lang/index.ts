import { enCa, enCaConfig } from './en-ca';
import { frCa, frCaConfig } from './fr-ca';
import { LanguageDef } from 'src/app/shared/pipes/translate.pipe';
// import { enUs, enUsConfig } from './en-us';

/**
 * add/remove language files here
 *
 * if there is only 1 loaded, the language toggle will not be available with the stock header
 */
export const languages: LanguageDef = {
	enCa: {label: 'English', dictionary: enCa, config: enCaConfig },
	// enUs: {label: 'English - US', dictionary: enUs, config: enUsConfig},
	frCa: {label: 'Français - Canadien', dictionary: frCa, config: frCaConfig },
};
