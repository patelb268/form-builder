type TimeTransformFn = (date: Date, str: string) => Date | null;

const noon: TimeTransformFn = (date, str) => {
	date?.setHours(12, 0, 0, 0);
	return date;
}
const now: TimeTransformFn = (date, str) => {
	const n = new Date();
	date?.setHours(n.getHours(), n.getMinutes(), n.getSeconds(), n.getMilliseconds());
	return date;
}
const midnight: TimeTransformFn = (date, str) => {
	date?.setHours(0, 0, 0, 0);
	return date;
}

const conversions: {[name: string]: TimeTransformFn} = {
	noon,
	noo: noon,
	now,
	no: now,
	n: now,
	midnight,
	midnigh: midnight,
	midnig: midnight,
	midni: midnight,
	midn: midnight,
	mid: midnight,
	mi: midnight,
	m: midnight
}

export function timeStringToDate(source: string, date = new Date()): Date | null | false {
	const adjusted = `${source}`.replace(/\s/g, '').trim().toLowerCase(); // correct a buncha
	if (!adjusted) { return null; }

	if (typeof conversions?.[adjusted] === 'function') {
		return conversions?.[adjusted](date, adjusted);
	}

	const hasAm = /a/ig.test(adjusted),
		hasPm = /p/ig.test(adjusted),
		fixed = adjusted
			.replace(/\./g, ':')  // convert decimal to :
			.split(':').map(x => x.padStart(2, '0'))
			.join('')
			.replace(/\D/g, ''), // strip out non numeric, retain the ':' for now
		len = fixed.length;

	let hours: number,
		mins: number;

	switch (len) {
		case 4:
		case 3:
			hours = +fixed.substr(0, 2);
			mins = +fixed.substr(2, 2);
			break;
		case 2:
		case 1:
			hours = +fixed.substr(0, 2);
			mins = 0;
			break;
		default:
			return null;
	}


	if(hasAm && hours > 11) {
		hours -= 12;
	} else if (hasPm && hours < 12) {
		hours += 12;
	}

	if (hours >= 0 && hours <= 23 && mins >= 0 && mins <= 59) {
		date.setHours(hours, mins, 0, 0);
		return date;
	}

	return false;
}


export function timeStringToDateTest(): boolean {
	const d = new Date(),
		now = new Date(),
		nowH = now.getHours(),
		nowM = now.getMinutes(),
		tests: [string, number | boolean | null, number][] = [
			['noon', 12, 0],
			['noo', 12, 0],
			['now', nowH, nowM],
			['no', nowH, nowM],
			['n', nowH, nowM],
			['midnight', 0, 0],
			['mid', 0, 0],
			['mi', 0, 0],
			['m', 0, 0],
			['1234', 12, 34],
			['123', 12, 3],
			['12', 12, 0],
			['1', 1, 0],
			['12a', 0, 0],
			['12p', 12, 0],
			['15a', 3, 0],
			['12:05', 12, 5],
			['12:05a', 0, 5],
			['12:05p', 12, 5],
			['12.5', 12, 5],
			['6p', 18, 0],
			['18h4', 18, 4],
			['1833a', 6, 33],
			['1:5', 1, 5],
			['1:15', 1, 15],
			['12:', 12, 0],
			['0.5', 0, 5],
			['.15', 0, 15],
			['1299', null, null], // null HOURS triggers an intentional bad response
			['    ', null, null]
		],
		failures = tests.map(([t, hours, mins]) => {
			const x = timeStringToDate(t, new Date(d));
			if (x) {
				if (x.getHours() === hours && x.getMinutes() === mins) {
					return [t, true];
				}
			} else if (!hours) {
				return [t, true];
			}
			console.warn('failure', {x, t, hours, mins});
			return [t, false];
		}).filter(([test, result]) => !result);

	if (failures.length) {
		console.warn('failures', failures);
		return false;
	} else {
		console.log('all tests passed!', tests);
		return true;
	}
}
