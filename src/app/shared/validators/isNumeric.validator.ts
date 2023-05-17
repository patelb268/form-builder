import { AbstractControl } from '@angular/forms';

const IsNumericError = {isNumeric: false};

export function IsNumericValidator(control: AbstractControl & {nativeElement: HTMLInputElement}) {
	const v = +(control.value || 0);
	if (!v) {
		// check for a scrubbed value
		const input = control?.nativeElement;
		if (input && !input.validity.valid) {
			return IsNumericError;
		}
	}
	return isNaN(v) ? IsNumericError : null;
}
