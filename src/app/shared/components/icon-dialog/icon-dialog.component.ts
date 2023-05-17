import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MATERIAL_ICONS } from '../../utils/materialIcons';

export interface IconDialogParams {
	value?: string;
}

@Component({
	selector: 'app-icon-dialog',
	templateUrl: './icon-dialog.component.html',
	styleUrls: ['./icon-dialog.component.scss'],
	
})
export class IconDialogComponent implements OnInit {

	selected: string;

	all = MATERIAL_ICONS;

	constructor(
		@Inject(MAT_DIALOG_DATA) private _data: IconDialogParams,
	) {

	}

	ngOnInit(): void {
		const d = this._data;
		this.selected = d.value || null;
	}

}
