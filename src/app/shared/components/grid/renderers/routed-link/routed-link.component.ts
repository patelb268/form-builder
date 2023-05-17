import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

export interface RoutedLinkComponentParams extends ICellRendererParams {
	url?: (data: any) => string;
	noLink?: boolean;
}

@Component({
	selector: 'app-grid-renderer-routed-link',
	templateUrl: './routed-link.component.html',
	styleUrls: ['./routed-link.component.scss'],
	
})
export class RoutedLinkComponent implements ICellRendererAngularComp {

	url: string;
	label: string;
	noLink: boolean;
	value: any;

	agInit(p: RoutedLinkComponentParams) {
		this.value = p.value;
		this.label = p.valueFormatted || p.value;
		if (p?.url) {
			this.url = p.url(p.data);
		}
		this.noLink = !!p.noLink;
	}

	refresh() {
		return false;
	}

}
