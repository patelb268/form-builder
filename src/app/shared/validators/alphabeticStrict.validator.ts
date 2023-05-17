import { AbstractControl } from '@angular/forms';

export const alphabeticStrictRegex = /^[a-z]+$/i;

export function AlphabeticStrictValidator(control: AbstractControl) {
	return control.value ? alphabeticStrictRegex.test(control.value) ? null : {alphabeticStrict: true} : null;
}
