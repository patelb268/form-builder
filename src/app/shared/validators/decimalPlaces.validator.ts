import { ValidatorFn, AbstractControl } from '@angular/forms';


export function DecimalPlacesValidator(places: number): ValidatorFn {
	return (control: AbstractControl): null | {decimalPlaces: {max: number}} => {
		const v = +(control.value || 0),
			rem = ('' + v).split('.');
		if (rem.length > 1 && rem.pop().length > places) {
			return {decimalPlaces: {max: places}};
		}
		return null;
	};
}
