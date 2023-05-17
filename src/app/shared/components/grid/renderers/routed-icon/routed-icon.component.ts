import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { TranslatePipe } from 'src/app/shared/pipes/translate.pipe';
import { ThemePalette } from '@angular/material/core';
import { PermBits } from 'auxilium-connect';

interface RoutedIconComponentParams extends ICellRendererParams {
	icon: string;
	color?: ThemePalette;
	tooltip?: string;
	click?: (row: any)=> void;
	data: PermBits;
	permissionKey: '_updateable' | '_deleteable';
	url: <T>(row: T) => string | string;
}

@Component({
	selector: 'app-grid-renderer-routed-icon',
	templateUrl: './routed-icon.component.html',
	styleUrls: ['./routed-icon.component.scss'],
	
})
export class RoutedIconComponent implements ICellRendererAngularComp {

	static width = 24;

	disabled = false;
	icon: string;
	color: ThemePalette;
	width = RoutedIconComponent.width;
	tooltip: string;
	url: string;
	click: any;
	cellInfo = null;
	constructor() { }

	agInit(p: RoutedIconComponentParams) {
		this.cellInfo = p;
		const url = p.url;

		this.disabled = !p.value;
		this.icon = TranslatePipe.instance.transform(p.icon);
		this.color = p.color;
		this.tooltip = p.tooltip;

		if (!this.disabled && url) {
			if (typeof url === 'string') {
				this.url = url;
			} else {
				this.url = url(p.data);
			}
		}
	}

	onClick($event){
		this.cellInfo?.click? this.cellInfo?.click($event): '';
	}

	refresh() {
		return false;
	}

}
