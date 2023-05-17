import { OperatorFunction, pipe } from 'rxjs';
import { debounceTime, map, distinctUntilChanged } from 'rxjs/operators';

export function searchStringToArray(val: string): string[] {
	const ret = ('' + (val || ''))
		.split(' ')
		.map(v => v.trim())
		.filter(v => !!v);
	return ret.length ? ret : null;
}

export function searchStringToRegexArray(val: string, flags = 'gi'): RegExp[] {
	const arr = searchStringToArray(val);
	if (arr?.length) {
		return arr.map(v => new RegExp(v, flags));
	} else {
		return [];
	}
}

/**
 * this function is used when listening to FormControl.valueChanges.
 * It throttles (debounceMs), and strips out excess spacing and does
 * some basic checks to ensure the data has actually changed
 *
 * note, it resolves as string[]
 */
export function searchStringToArrayPipe(debounceMs: number = 400 /* 400 is about 30wpm */): OperatorFunction<string, string[]> {
	return pipe(
		debounceTime(debounceMs),
		map(v => searchStringToArray(v) || []),
		distinctUntilChanged((x, y) => x.join() === y.join() )
	);
}
