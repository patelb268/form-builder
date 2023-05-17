import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

/**
 * this is flagged as posisbly not being needed once we get an editor working..
 */

@Component({
	selector: 'app-grid-renderer-checkbox',
	template: `<mat-icon>{{ ('icon_checkbox_' + !!checked) | translate }}</mat-icon>`,
	
})
export class CheckboxComponent implements ICellRendererAngularComp {

	checked: boolean;

	constructor() { }

	agInit(p: ICellRendererParams) {
		this.checked = !!p.value;
	}

	refresh() {
		return false;
	}

}

