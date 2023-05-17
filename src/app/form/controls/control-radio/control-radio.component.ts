import { ChangeDetectionStrategy, Component, ViewChild } from "@angular/core";
import { ThemePalette } from "@angular/material/core";
import { MatRadioButton } from "@angular/material/radio";
import {
	ColDef,
	ICellEditorParams,
	ICellRendererParams,
} from "ag-grid-community";
import { DlRadioControl } from "../../models/control";
import { ControlBase } from "../control-base";

export interface ControlRadioParams {
	hideLabel?: boolean;
	color?: ThemePalette;
}

@Component({
	selector: "app-control-radio",
	templateUrl: "./control-radio.component.html",
	styleUrls: ["./control-radio.component.scss"]
})
export class ControlRadioComponent extends ControlBase<DlRadioControl> {
	@ViewChild("radioboxNode", { read: MatRadioButton, static: false })
	radioboxNode: MatRadioButton;

	private _def: ColDef;

	private _agParams: (ICellEditorParams | ICellRendererParams) &
		ControlRadioParams;

	hideLabel: boolean;
	inGrid = false;
	color: ThemePalette = "primary";

	check(r){
		console.log(r);
	}

	onChange(evt: Event) {
		if (this.inGrid && !this.control?.disabled) {
			const nextValue = !this.control?.value;
			this._agParams.node.setDataValue(this._def.colId, nextValue);
		}
	}

	afterGuiAttached() {
		super.afterGuiAttached();
		this.radioboxNode.focus();
	}

	agInit(p: (ICellEditorParams | ICellRendererParams) & ControlRadioParams) {
		super.agInit(p);

		this._agParams = p;

		this.inGrid = true;
		this.hideLabel = !!p.hideLabel;

		// this needs to check permissions
		const def = (this._def = p.column?.getUserProvidedColDef()),
			editable: any = def?.editable,
			canEdit = typeof editable === "function" ? editable(p) : !!editable;

		if (!canEdit) {
			this.control.disable();
		}

		if ("color" in p) {
			this.color = p.color;
		}
	}
}
