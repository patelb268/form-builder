import { ValidatorFn, AbstractControl } from '@angular/forms';
import { PhoneNumberUtil } from 'google-libphonenumber';

const PNU = PhoneNumberUtil.getInstance();

export function PhoneNumberValidator(regionCode: string = 'US'): ValidatorFn {
	return (control: AbstractControl): null | {phoneNumber: boolean} => {
		const val = control.value;
		let valid = false;
		if (!val) {
			return null;
		}
		try {
			const num = PNU.parseAndKeepRawInput(val, 'US');
			valid = PNU.isValidNumber(num);
		} catch (e) {}
		return valid ? null : {
			phoneNumber: true
		};
	};
}
