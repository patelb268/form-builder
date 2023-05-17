import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from './translate.pipe';

@Pipe({
	name: 'localeDate'
})
export class LocaleDatePipe extends DatePipe implements PipeTransform {

	transform(value: any, format?: string, timezone?: string): any {
		return super.transform(value, format, timezone, TranslatePipe.locale);
	}

}
