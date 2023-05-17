import { Component, ChangeDetectionStrategy } from "@angular/core";
import { ControlBase } from "../control-base";
import { DlNumberboxControl } from "../../models/control";
import { formatCurrency, formatNumber } from "@angular/common";
import { TranslatePipe } from "src/app/shared/pipes/translate.pipe";

@Component({
	selector: "app-control-numberbox",
	templateUrl: "./control-numberbox.component.html",
	styleUrls: ["./control-numberbox.component.scss"],
})
export class ControlNumberboxComponent extends ControlBase<DlNumberboxControl> {
	format() {
		let v = this.control.value,
			params = this.params,
			currency = params.currency,
			percent = params.symbol;

		if (v || v === 0) {
			if (currency) {
				return formatCurrency(
					v,
					currency.locale,
					currency.currency,
					currency.currencyCode,
					currency.digitsInfo
				);
			}
			if (params.decimalPlaces) {
				v= formatNumber(
					v,
					TranslatePipe.locale,
					`1.${params.decimalPlaces}-${params.decimalPlaces}`
				);
			}
			if (percent) {
				v = v + percent;
			}
			// check for precision
			return v;
		}
		return "";
	}
}
