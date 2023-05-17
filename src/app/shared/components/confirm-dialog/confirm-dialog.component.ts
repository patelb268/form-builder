import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { ThemePalette } from '@angular/material/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslatePipe } from '../../pipes/translate.pipe';

export type ConfirmDialogResponse = boolean;

interface OptionalParams {
	yesLabel?: string;
	noLabel?: string;
	title?: string;
	translate?: boolean | {
		message?: boolean;
		yesLabel?: boolean;
		noLabel?: boolean;
		title?: boolean;
	};
	yesColor?: ThemePalette;
	noColor?: ThemePalette;
}
export interface ConfirmDialogParams extends OptionalParams {
	message: string | string[];
}

@Component({
	selector: 'app-confirm-dialog',
	templateUrl: './confirm-dialog.component.html',
	styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent implements OnInit {

	yesLabel: string;
	noLabel: string;
	message: string;
	title: string;
	yesColor: ThemePalette = 'accent';
	noColor: ThemePalette = 'primary';

	constructor(
		@Inject(MAT_DIALOG_DATA) private _data: ConfirmDialogParams,
	) { }

	ngOnInit() {

		const translate = TranslatePipe.instance.transform,
			data = this._data,
			should = (data.translate ? data.translate === true ? {yesLabel: true, noLabel: true, title: true, message: true} : data.translate : {}) || {},
			shouldYes = should.hasOwnProperty('yesLabel') ? should.yesLabel : true,
			shouldNo = should.hasOwnProperty('noLabel') ? should.noLabel : true;

		let yes = data.yesLabel || 'Yes',
			no = data.noLabel || 'No',
			message = typeof data.message === 'string' ? data.message : data.message.join('<br><br>'),
			title = data.title || '';

		if (should.message) { message = translate(message); }
		if (should.title) { title = translate(title); }
		if (shouldYes) { yes = translate(yes); }
		if (shouldNo) { no = translate(no); }
		if (data.yesColor) { this.yesColor = data.yesColor; }
		if (data.noColor) { this.noColor = data.noColor; }

		this.message = message;
		this.title = title;
		this.yesLabel = yes;
		this.noLabel = no;

		console.log('final', this, {yes, no, message, title});
	}

}
