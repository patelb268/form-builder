import { AbstractControl } from '@angular/forms';

export const alphanumericStrictRegex = /^[a-z0-9]+$/i;

export function AlphanumericStrictValidator(control: AbstractControl) {
	return control.value ? alphanumericStrictRegex.test(control.value) ? null : {alphanumericStrict: true} : null;
}
