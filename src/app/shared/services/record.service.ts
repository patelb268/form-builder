import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { SliceQueryParams, Slice } from '../models/slice';
import { ApiService } from './api.service';

export interface RecordReplaceParams {
	in?: number[]; // if no keys exist, assumes the entire recordset
	clone?: {
		replace?: boolean; // what?
		before?: boolean;
		after?: boolean;
	},
	field: string;
	value: any;
	where?: any;
	userparams?: any;
}



// type CachedQueries = Map<string, Observable<any>>;

@Injectable({
	providedIn: 'root'
})
export class RecordService {

	// private _queryCache = new Map<number | string, CachedQueries>();

	constructor(
		private _api: ApiService,
	) {

	}

	private _getSliceId(slice: Slice | number) {
		return slice instanceof Slice ? slice.id : slice;
	}

	query<T /*RowType */>(slice: Slice | number | string, query: SliceQueryParams, expiresMs = 30000): Observable<T[]> {
		const target: string | number = slice instanceof Slice ? slice.id : slice;
		return this._api
			.report<T>(target, query)
			.pipe(
				map(resp => resp?.rows || ([] as T[])),
			);
	}

	queryIds<T /*key type */>(slice: Slice | number, query: SliceQueryParams) {
		const target = slice instanceof Slice ? slice.id : slice,
			params: SliceQueryParams = Object.assign({}, {slice: target}, query, {return: {pkeys: true}});
		return this._api
			.request<{pkeys: T[]}>({'$/slice/report': params})
			.pipe(
				map(resp => {
					const keys = resp?.pkeys || [],
						count = keys.length;
					return {keys, count};
				})
			);
	}

	/**
	 *
	 * @param slice slice or slice.id
	 * @param params details
	 * @returns Row[] or NULL on error/no replacements
	 */
	replace(slice: Slice | number, params: RecordReplaceParams): Observable<{keys: number[], rows: any[]}> {

		const isArray = (Object.prototype.toString.call(params.value) === '[object Array]'),
			target = this._getSliceId(slice),
			where = params.where,
			userparams = params.userparams,
			value = params.value,
			req = isArray || value?.$excel ?
				this._api
					.report<{id: Number, _value: any}>(target, {
						userparams,
						fields: {id: 'id', _value: value},
						where: this._combineWhereWithIn(where, params?.in, 'id'),
					})
					.pipe(
						map(resp => resp.rows.map(r => ({id: r.id, [params.field]: r._value}))),
					)
				: params.in?.length
				? of(params.in.map(id => ({id, [params.field]: value})))
				: this._api
					.request<number[]>({'$/slice/report': {
						where,
						userparams,
						slice: target,
						return: {pkeys: true},
					}, $pop: 'pkeys'})
					.pipe(
						map(ids => ids.map(id => ({id, [params.field]: value}))),
					);

		// ok, hold up..


		return req
			.pipe(
				tap(resp => {
					console.log({value})
					debugger;
				}),
				switchMap(rows => this._api
					.updateRows(target, rows)
					.pipe(
						map(resp => {
							if (resp.success) {
								return {
									keys: resp.keys,
									rows
								};
							}
							console.warn('failure', {resp});
							return null;
						}),
						catchError(err => {
							console.warn('error: record.service:replace', {err});
							return of(null);
						}),
					)
				),
			);
	}

	private _combineWhereWithIn(where?: any, inArr?: number[], field = 'id') {
		const whereIn = inArr?.length ? ['$in', ['$field', field], inArr] : null;
		if (where && whereIn) {
			return ['$and', where, whereIn];
		} else {
			return whereIn || where || null;
		}
	}
}

// interface RecordChanges {
// 	slice: number; // slice id
// 	record: number; // record id
// 	stamp: Date; // date touched
// 	action: number;

// 	transaction?: string; // futureproofing?
// }

// interface RecordChangesParams {
// 	slice?: number | number[];
// 	record?: number | number[];
// 	from?: Date;
// 	to?: Date;
// 	action?: number | number[];
// 	limit: number | {start: number, end: number};
// }
