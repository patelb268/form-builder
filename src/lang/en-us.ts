import locale from '@angular/common/locales/en-US-POSIX';
import extra from '@angular/common/locales/extra/en-US-POSIX';
import { LanguageConfig } from 'src/app/shared/pipes/translate.pipe';

// the majority is the same as english-canadian, so.. just leave it here
export const enUs: {[key: string]: string} = {
}

export const enUsConfig: LanguageConfig = {
	code: 'en-US',
	locale: locale,
	extra: extra,
}