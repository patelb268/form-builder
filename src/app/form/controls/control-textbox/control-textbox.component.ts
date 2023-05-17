import {
	Component,
	ChangeDetectionStrategy,
	ViewChild,
	ElementRef,
	OnInit,
	Output,
	EventEmitter,
} from "@angular/core";

import { DlTextboxControl } from "../../models/control";
import { ControlBase } from "../control-base";

@Component({
	selector: "app-control-textbox",
	templateUrl: "./control-textbox.component.html",
	styleUrls: ["./control-textbox.component.scss"],
})
export class ControlTextboxComponent
	extends ControlBase<DlTextboxControl>
	implements OnInit
{
	// @ViewChild('input', {read: ElementRef, static: false}) input: ElementRef<HTMLInputElement>;

	// // agGrid
	// focusIn() {
	// 	this.input?.nativeElement?.focus();
	// }

	// focusOut() {
	// 	this.input?.nativeElement?.blur();
	// }

	@Output('change')
	change = new EventEmitter<string>();

	format() {
		const v = this.control.value,
			params = this.params;

		return v;
	}

	onChange(){
		this.change.emit(this.params.id);
	}

	ngOnInit() {
		super.ngOnInit();
	}
}
