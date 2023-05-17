import { Pipe, PipeTransform, Output, EventEmitter } from '@angular/core';
import { languages } from '../../../lang';
import { environment } from 'src/environments/environment';
import { registerLocaleData } from '@angular/common';
// import { registerLocaleData } from '@angular/common';

export interface Dictionary {
	[key: string]: string;
}

export interface LanguageDef {
	[key: string]: {
		label: string;
		dictionary: Dictionary;
		config: LanguageConfig;
	};
}
export interface LanguageConfig {
	currency: string; // https://en.wikipedia.org/wiki/ISO_4217
	locale: any;
	code: string; // eg, en-CA
	extra: any;
}

@Pipe({
	name: 'translate',
	pure: false,
})
export class TranslatePipe implements PipeTransform {

	constructor() {
		const tp = TranslatePipe;
		let lang = tp._language;
		if (!tp._instance) {
			tp._instance = this;
			lang = tp._language = (localStorage.getItem('language') || environment.language || tp._defaultLanguage) as keyof LanguageDef;
			if (tp.languages[lang]) {
				TranslatePipe._dictionary = tp.languages[lang].dictionary;
				this._registerLocaleConfig(tp.languages[lang].config, true);
			} else {
				console.warn(`language "${lang}" was not found, defaulting to "${tp._defaultLanguage}"`);
				const l = tp.languages[tp._defaultLanguage];
				TranslatePipe._dictionary = l.dictionary;
				this._registerLocaleConfig(l.config, true);
			}
		}
	}

	static get instance() {
		return this._instance || new TranslatePipe();
	}

	get language() {
		return TranslatePipe._language;
	}
	// static instance: TranslatePipe;
	static languages: LanguageDef = languages;
	static locale: string;
	static config: LanguageConfig;
	// static locale: LocaleConfi
	private static _language: keyof LanguageDef;
	private static _dictionary: Dictionary;
	private static _defaultLanguage: keyof LanguageDef = 'enCa';
	private static _instance: TranslatePipe;

	// tslint:disable-next-line: no-output-native
	@Output() change: EventEmitter<keyof LanguageDef> = new EventEmitter();

	private _registeredLocales = new Set<LanguageConfig>();

	getAsOptions() {
		return Object.entries(TranslatePipe.languages)
			.map(([key, val]) => ({label: val.label, id: key}));
	}

	// getCurrencySymbol() {
	// 	const c = TranslatePipe.config;
	// 	console.log('getcurrencysymbol', getCurrencySymbol(c.currency, 'narrow', c.code));
	// 	return getCurrencySymbol(c.currency, 'narrow', c.code);
	// }

	transform(value: string, params?: object) {
		const tp = TranslatePipe,
			d = tp._dictionary;
		let txt = (d[value] || '') as string;
		if (!txt) {
			txt = (tp.languages[tp._defaultLanguage].dictionary[value]) || value;
		}
		if (params) {
			return txt.replace(/\{([a-z_-]*?)\}/gi, (match, prop: string) => {
				return params[prop] || params[prop] === 0 ? ('' + (params[prop])) : '';
			});
		} else {
			return txt;
		}
	}

	changeLanguage(to: keyof LanguageDef) {
		const tp = TranslatePipe,
			d = tp.languages[to];
		if (d) {
			tp._language = to;
			tp._dictionary = d.dictionary;
			localStorage.setItem('language', '' + to);
			this._registerLocaleConfig(d.config, true);
			this.change.emit(to);
			return true;
		} else {
			throw 'dictionary_not_found';
		}
	}

	private _registerLocaleConfig(config: LanguageConfig, makeActive?: boolean) {
		const reg = this._registeredLocales;
		if (config && !reg.has(config)) {
			registerLocaleData(config.locale, config.code, config.extra);
			reg.add(config);
		}
		if (makeActive) {
			TranslatePipe.locale = config.code;
			TranslatePipe.config = config;
		}
	}

}
