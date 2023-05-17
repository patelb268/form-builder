import { ValidatorFn, AbstractControl } from '@angular/forms';

export const telExtensionRegex = /^[0-9\*#,;]+$/;

export function TelExtensionValidator(control: AbstractControl) {
	return control.value ? telExtensionRegex.test(control.value) ? null : {telExtension: true} : null;
}
