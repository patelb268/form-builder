import { AsyncValidatorFn, AbstractControl } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { OptionRowValue, DlFormControl, DlHasLimitToListValidator } from 'src/app/form/models/control';
import { map } from 'rxjs/operators';

export function LimitToListValidator(controlDef: DlFormControl & DlHasLimitToListValidator): AsyncValidatorFn {
	return (control: AbstractControl): Observable<null | {optionNotInList: boolean}> => {
		const v = control.value as OptionRowValue;
		if (v && controlDef && controlDef._notInListValidation) {
			return controlDef._notInListValidation(v)
				.pipe(
					map(valid => valid ? null : {optionNotInList: valid})
				);
		} else {
			return of(null);
		}
	};
}
