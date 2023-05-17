import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslatePipe } from '../pipes/translate.pipe';

@Injectable({
	providedIn: 'root'
})
export class TitleService {

	constructor(
		private _title: Title
	) {

	}

	setTitle(title: string[]) {
		this._title.setTitle(`Datalynk: ${title.join(' - ')}`);
	}

	getTitle() {
		return this._title.getTitle();
	}
}
