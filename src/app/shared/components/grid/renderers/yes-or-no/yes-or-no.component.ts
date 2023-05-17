import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
	selector: 'app-grid-renderer-yes-or-no',
	template: `{{ (v ? 'Yes' : 'No') | translate }}`,
	
})
export class YesOrNoComponent implements ICellRendererAngularComp {

	v: boolean;

	constructor() { }

	agInit(p: ICellRendererParams) {
		this.v = !!(p.value);
	}

	refresh() {
		return false;
	}

}
