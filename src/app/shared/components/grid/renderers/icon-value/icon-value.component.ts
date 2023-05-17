import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ThemePalette } from '@angular/material/core';

export interface IconValueComponentParams extends ICellRendererParams {
	color?: ThemePalette;
	disable?: (row: object) => boolean | boolean;
}

@Component({
  selector: 'app-grid-renderer-icon-value',
  templateUrl: './icon-value.component.html',
  styleUrls: ['./icon-value.component.scss'],
  
})
export class IconValueComponent implements ICellRendererAngularComp {

	color: ThemePalette;
	icon: string;
	disabled: boolean;

	agInit(p: IconValueComponentParams) {
		this.icon = p.valueFormatted || p.value;
		this.color = p.color;

		if (typeof p.disable === 'function') {
			this.disabled = !!(p.disable(p.data));
		} else {
			this.disabled = !!p.disable;
		}
	}

	refresh() {
		return false;
	}

}
