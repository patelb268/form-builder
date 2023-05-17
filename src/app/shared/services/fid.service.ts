import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { shareReplay, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ApiReportResponse } from 'auxilium-connect';

interface NumberTypeResponse {
	min: string | null;
	max: string | null;
	default?: 0 | 1;
}
export interface NumberType {
	id: string;
	min: number | null;
	max: number | null;
	default?: boolean;
}

@Injectable({
  	providedIn: 'root'
})
export class FidService {

	private _allTypes: Observable<any>;

	static makeMinMaxRow(row: NumberTypeResponse): NumberType {
		const min = parseFloat(row.min),
			max = parseFloat(row.max);
		return {
			id: `${min}_${max}`,
			max,
			min,
			default: !!row.default,
		};
	}

	constructor(
		private _api: ApiService,
	) { }


	numberTypes(): Observable<NumberType[]> {
		return this._allTypes || (this._allTypes = this._api
			.request<ApiReportResponse<NumberTypeResponse>>({'$/datalynk/modules/numberTypes': {}}, {labelAs: 'numberTypes'})
			.pipe(
				map(resp => resp.rows),
				map(rows => rows.map(r => FidService.makeMinMaxRow(r))),
				shareReplay(1),
			)
		);
	}
}
