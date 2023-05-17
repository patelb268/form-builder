import localeFr from '@angular/common/locales/fr-CA';
import localeFrExtra from '@angular/common/locales/extra/fr-CA';
import { LanguageConfig } from 'src/app/shared/pipes/translate.pipe';

export const frCa: {[key: string]: string} = {

	by: 'par',

	'Created:': 'Créé:',

	From: 'De',
	'From:': 'De:',

	Language: 'La langue',
	Login: 'S\'identifier',
	Logout: 'Connectez - Out',

	'Modified:': 'Modifié:',

	No: 'Non',

	phone: 'Appel',
	Print: 'Impression',

	Record: 'Enregistrer',
	Records: 'Enregistrements',

	Search: 'Chercher',
	Sent: 'Expédié',
	Subject: 'Matière',

	To: 'À',
	'To:': 'À:',

	Yes: 'Oui',
};

export const frCaConfig: LanguageConfig = {
	code: 'fr-CA',
	locale: localeFr,
	extra: localeFrExtra,
	currency: 'CAD',
};
