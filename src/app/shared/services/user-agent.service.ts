import { Injectable } from '@angular/core';
import { UAParser } from 'ua-parser-js';
import { AuthHistoryRow } from 'src/app/admin/services/user-admin.service';

@Injectable({
	providedIn: 'root'
})
export class UserAgentService {

	private _cache = new Map<string, UAParser.IResult>();

	constructor() { }

	parse(ua: string) {
		const c = this._cache;
		let ret = c.get(ua);
		if (!ret) {
			c.set(ua, ret = new UAParser(ua).getResult());
		}
		return ret;
	}

	expandSessionRows(rows: AuthHistoryRow[]) {
		return rows.map(r => this.expandSessionRow(r));
	}

	expandSessionRow(row: AuthHistoryRow) {
		if (!row.device && row.agent) {
			row.device = this.parse(row.agent);
		}
		return row;
	}
}
