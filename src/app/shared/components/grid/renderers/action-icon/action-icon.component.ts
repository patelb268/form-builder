import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ThemePalette } from '@angular/material/core';

interface ActionIconComponentParams extends ICellRendererParams {
	icon: string;
	tooltip: string;
	color: ThemePalette;
	onClick: (row: any) => void;
}

@Component({
  selector: 'app-grid-renderer-action-icon',
  templateUrl: './action-icon.component.html',
  styleUrls: ['./action-icon.component.scss'],
  
})
export class ActionIconComponent implements OnInit, ICellRendererAngularComp {

	static width = 24;

	icon: string;
	color: ThemePalette;
	tooltip: string;
	disabled = false;
	row: any;

	onClick: (row: any) => void;

	constructor() { }

	ngOnInit() {
	}

	agInit(p: ActionIconComponentParams) {
		this.disabled = !p.value;
		this.color = p.color;
		this.icon = p.icon;
		this.tooltip = p.tooltip;
		this.onClick = p.onClick;
		this.row = p.data;
	}

	onActionClick() {
		if (!this.disabled) {
			this.onClick(this.row);
		}
	}


	refresh() { return false; }

}
