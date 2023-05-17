import { Component, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { ControlBase } from '../control-base';
import { DlCheckboxControl } from '../../models/control';
import { ICellEditorParams, ICellRendererParams, ColDef } from 'ag-grid-community';
import { MatCheckbox } from '@angular/material/checkbox';
import { ThemePalette } from '@angular/material/core';
import { FormControl } from '@angular/forms';

export interface ControlCheckboxParams {
	hideLabel?: boolean;
	color?: ThemePalette;
}

@Component({
	selector: 'app-control-checkbox',
	templateUrl: './control-checkbox.component.html',
	styleUrls: ['./control-checkbox.component.scss']
})
export class ControlCheckboxComponent extends ControlBase<DlCheckboxControl> {

	@ViewChild('checkboxNode', {read: MatCheckbox, static: false}) checkboxNode: MatCheckbox;

	private _def: ColDef;

	private _agParams: (ICellEditorParams | ICellRendererParams) & ControlCheckboxParams;

	hideLabel: boolean;
	inGrid = false;
	color: ThemePalette = 'primary';

	onClick(evt: Event, params) {
		if (this.inGrid && !this.control?.disabled) {
			const nextValue = !(this.control?.value);
			this._agParams.node.setDataValue(this._def.colId, nextValue);
		}
	}

	afterGuiAttached() {
		super.afterGuiAttached();
		this.checkboxNode.focus();
	}

	ngOnInit(): void {
		const p = this.params,
			fg = this.formGroup;

		if (p && fg && !this.control && p.id) {
			this.control = fg.get(p.id);
			if(!this.control) {
				this.control = new FormControl();
			}
		}

		if (!this.control) {
			throw "uhhhh, you messed up bro";
		}
	}

}
