import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { convertLegacyHtml } from 'src/app/shared/utils/convertLegacyHtml';

@Component({
	selector: 'app-grid-renderer-html-renderer',
	templateUrl: './html-renderer.component.html',
	styleUrls: ['./html-renderer.component.scss'],
	
})
export class HtmlRendererComponent implements OnInit, ICellRendererAngularComp {

	raw: string;

	constructor(
		private _cd: ChangeDetectorRef,
	) { }

	ngOnInit() {
	}

	agInit(p: ICellRendererParams) {
		this.raw = convertLegacyHtml(p.value);
	}

	refresh() {
		this._cd.markForCheck();
		return false;
	}

}
