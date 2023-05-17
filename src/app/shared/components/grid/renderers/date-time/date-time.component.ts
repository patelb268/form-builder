import { ChangeDetectionStrategy, Component } from "@angular/core";
import { AppService } from "@services/app.service";
import { ICellRendererAngularComp } from "ag-grid-angular";
import { ICellRendererParams } from "ag-grid-community";

@Component({
	selector: "app-grid-renderer-date-time",
	template: `{{
		d ? (d | localeDate: p.format) : ""
	}}`,
	
})
export class DateTimeComponent implements ICellRendererAngularComp {
	d: Date;
	p: any;

	constructor(public app: AppService) {
	}

	agInit(p: ICellRendererParams) {
		// console.log(p,'params')
		this.p = p;
		this.d = p.value;
		// this.format = p.format;
	}

	refresh() {
		return false;
	}
}
