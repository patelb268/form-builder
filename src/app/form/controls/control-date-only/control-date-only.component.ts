import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	OnInit,
} from "@angular/core";
import { timeStringToDate } from "src/app/shared/modules/dl-date-time/timeStringToDate";
import { DlTextboxControl } from "../../models/control";
import { ControlBase } from "../control-base";

@Component({
	selector: "app-control-date-only",
	templateUrl: "./control-date-only.component.html",
	styleUrls: ["./control-date-only.component.scss"],
})
export class ControlDateOnlyComponent
	extends ControlBase<DlTextboxControl>
	implements OnInit
{
	form = null;
	constructor(elementRef: ElementRef) {
		super(elementRef);
	}

	ngOnInit(): void {
		super.ngOnInit();
	}

	
	
}
