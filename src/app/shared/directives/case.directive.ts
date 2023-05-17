import { Directive, HostListener, Input } from "@angular/core";

@Directive({
	selector: "[appCase]",
})
export class CaseDirective {
	@Input("caseType")
	caseType: string = null;

	@Input() appCase: string;

	private getCaret(el) {
		return {
			start: el.selectionStart,
			end: el.selectionEnd,
		};
	}

	private setCaret(el, start, end) {
		el.selectionStart = start;
		el.selectionEnd = end;

		el.focus();
	}

	private dispatchEvent(el, eventType) {
		const event = document.createEvent("Event");
		event.initEvent(eventType, false, false);
		el.dispatchEvent(event);
	}

	private convertValue(el, value) {}

	// @HostListener("blur", ["$event.target", "$event.target.value"])
	// onBlur(el: any, value: string): void {
	// 	console.log(this.caseType);
	// 	if (
	// 		(!this.appCase || "blur" === this.appCase) &&
	// 		"function" === typeof value.toUpperCase &&
	// 		value.toUpperCase() !== value
	// 	) {
	// 		this.convertValue(el, value);
	// 		this.dispatchEvent(el, "blur"); // in case updateOn is set to blur
	// 	}
	// }

	@HostListener("input", ["$event.target", "$event.target.value"])
	onInput(el: any, value: string): void {
		console.log(this.caseType);

		let { start, end } = this.getCaret(el);
		switch (this.caseType) {
			case "uppercase":
				if (
					!this.appCase &&
					"function" === typeof value.toUpperCase &&
					value.toUpperCase() !== value
				) {
					if (value[0] === " " && start === 1 && end === 1) {
						start = 0;
						end = 0;
					}
				}
				el.value = value.toUpperCase();

		//		this.dispatchEvent(el, "input");
				break;
			case "lowercase":
				if (
					!this.appCase &&
					"function" === typeof value.toLowerCase &&
					value.toLowerCase() !== value
				) {
					if (value[0] === " " && start === 1 && end === 1) {
						start = 0;
						end = 0;
					}
				}
				el.value = value.toLowerCase();

		//		this.dispatchEvent(el, "input");
				break;

			case "capitalize":
				el.value  = value
					? value.charAt(0).toUpperCase() + value.slice(1)
					: "";
			//	this.dispatchEvent(el, "input");
				break;

			default:
				value = value;
				break;
		}

		this.setCaret(el, start, end);
	}
}
