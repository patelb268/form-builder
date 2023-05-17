import { Injectable, EventEmitter } from '@angular/core';
import { ApiService, FetchOptions } from './api.service';
import {
	map,
	shareReplay,
	distinctUntilChanged,
	tap,
	catchError,
	switchMap
} from 'rxjs/operators';
import { Slice, SliceOrder, SliceRow, SLICE_CATEGORY } from '../models/slice';
import { Fid } from '../models/fid';
import { systemSliceMeta } from '../utils/systemSliceMeta';
import { Nav } from '../models/nav';
import { Observable, of } from 'rxjs';
import { ApiReportResponse } from 'auxilium-connect';
import { sortObjectArrayByProperty } from '../utils/sortObjectArrayByProperty';
import { JotMetaPresentation } from '../models/jot';

interface SliceCacheRow {
	id: number;
	parent: number;
	// name: string;
	// modified: Date;
}
export interface SliceChangesEvent {
	created?: Slice[];
	modified?: Slice[];
	removed?: number[];
}

export type postQueryTransformFn = <T>(rows: T[]) => T[];

@Injectable({
	providedIn: 'root'
})
export class SliceService {
	private static _INIT_KEYS: (keyof SliceCacheRow)[] = ['id', 'parent'];
	private static _HEIRARCHY: Map<number, number> = new Map();

	static cacheDurationMS = 1000 * 60 * 5; // 5 minute cache

	private _sliceCache = new Map<number | string, Observable<Slice>>();
	private _rawSliceCache = new Map<number | string, SliceRow>();

	changes: EventEmitter<SliceChangesEvent> =
		new EventEmitter<SliceChangesEvent>();

	constructor(private _api: ApiService) {}

	save(slice: SliceRow): Observable<Slice> {
		const id = +slice.id;
		if (id) {
			return this._saveExisting(slice);
		} else if (slice.parent) {
			return this._saveNew(slice);
		} else {
			console.warn('no id provided, and no parent found');
			throw 'missing_id_or_parent';
		}
	}

	delete(id: number) {
		return this._api
			.request<{
				slice: number;
				slice_perms: number;
			}>({ '$/slice/destroy': { slice: id } })
			.pipe(
				map((resp) => !!(resp && resp.slice)),
				catchError((err) => {
					console.warn('server rejected delete', { id, err });
					return of(false);
				}),
				tap((resp) => (resp ? this._sliceRemoved(id) : null))
			);
	}

	fetchSimulated(
		id: string | number,
		opt: FetchOptions = {},
		mixin: SliceRow
	) {
		const rawCache = this._rawSliceCache;
		if (rawCache.has(id)) {
			console.log('raw data found in cache', id, rawCache.get(id));
			return of(
				new Slice(Object.assign({}, rawCache.get(id), mixin), this)
			);
		} else {
			return this.fetch(id, opt).pipe(
				map(
					(s) =>
						new Slice(
							Object.assign({}, rawCache.get(id), mixin),
							this
						)
				)
			);
		}
	}

	getDefaultFormIdFromSliceDetail(sliceDetail: Slice) {
		let def = null;
		if (sliceDetail) {
			def = Object.keys(
				(sliceDetail.root?.meta?.presentation as JotMetaPresentation)
					?.forms ||
					(sliceDetail.meta?.presentation as JotMetaPresentation)
						?.forms ||
					{}
			)
				.map((key) => +key)
				.pop();
		}

		return def;
	}

	// we MAY add an element that caches this...
	fetch(id: string | number, opt?: FetchOptions) {
		if (!id) {
			return of<Slice>(null);
		}
		if (+id == id) {
			id = +id;
		}
		const cache = this._sliceCache;
		if (!cache.has(id)) {
			cache.set(
				id,
				this._api.fetch(id, opt || {}).pipe(
					tap((raw) => {
						const rawCache = this._rawSliceCache;
						if (!rawCache.has(id)) {
							rawCache.set(id, raw || {});
						}
					}),
					map((s) => new Slice(s, this)),
					shareReplay(1)
				)
			);
		}
		return cache.get(id);
	}

	fetchRoot(id: number, opt?: FetchOptions) {
		const root = this.rootIdById(id);
		return this.fetch(root, opt);
	}

	rootIdById(id: number): number {
		const found = SliceService._HEIRARCHY.get(id) || id;
		return found !== id ? this.rootIdById(found) : found;
	}

	getSystemSliceMeta(id: number | string) {
		return systemSliceMeta.get(id);
	}

	getSortOnField(field: string, order: SliceOrder[]) {
		if (order) {
			// find the field match
			return order
				.map((o, index) => {
					const base = o[0];
					return {
						descending: base === '$desc',
						field: (base === '$field' ? o[1] : o[1][1]) as string,
						index
					};
				})
				.find((r) => r.field === field);
		}
		return undefined;
	}

	navData() {
		return this._api.request<Nav>(
			{ '$/datalynk/modules/navigationSchema': {} },
			{ labelAs: 'slices.navData' }
		);
	}

	getRoles(sliceId) {
		return this._api.request<any>(
			{ '$/slice/perms_matrix': { slice: sliceId } },
			{ labelAs: 'slices.roles' }
		);
	}

	getAllSliceDetailWithMeta() {
		return this._api.request({
			'$/tools/action_chain': [
				{
					'!/auth/current': {}
				},
				{
					'!/slice/permissions': {
						where: ['$neq', ['$field', 'name'], 'event members']
					}
				},
				{
					'!/tools/column': {
						col: 'id',
						rows: {
							$_: '1:rows'
						}
					}
				},
				{
					'!/slice/relations': {
						slices: {
							$_: '2'
						},
						ignorePermsCheck: true
					}
				},
				{
					'!/report/settings/get': {}
				},
				{
					$_: '*'
				}
			]
		});
	}

	rootSlices() {
		return this._api
			.request<ApiReportResponse<SliceRow>>(
				{
					'$/tools/do': [
						'perms',
						{
							'!/slice/permissions_lite': {
								where: { parent: null },
								order: [['$field', 'name']]
							}
						},
						'plucked',
						{
							'!/tools/pluck': {
								rows: { $_: 'perms:rows' },
								keys: ['id', 'name']
							}
						},
						'resp',
						{ rows: { $_: 'plucked', $_else: [] } }
					]
				},
				{ labelAs: 'slices.rootSlices' }
			)
			.pipe(map((r) => r.rows));
	}

	fids(sliceId: number): Observable<Fid[]> {
		if (!sliceId) {
			return of<Fid[]>([]);
		}
		return this.fetch(sliceId).pipe(
			map((slice) => Object.values(slice?.fids) as Fid[])
		);
	}

	all() {
		return this._api
			.request<{ rows: SliceRow[] }>(
				{ '$/slice/permissions_lite': {} },
				{ labelAs: 'slices.all' }
			)
			.pipe(map((resp) => resp.rows));
	}

	templateSlices(parent?: number) {
		const order = [['$asc', ['$field', 'name']]],
			cat = { category: 'template' },
			appWhere = Object.assign(
				{},
				{ parent: null, category: 'report' },
				parent ? { id: parent } : {}
			),
			where = Object.assign(
				{},
				{ category: 'template' },
				parent ? { parent } : {}
			);
		return this._api
			.request<{
				templates: ApiReportResponse<SliceRow>;
				applications: ApiReportResponse<SliceRow>;
			}>(
				{
					'$/tools/do': [
						'templates',
						{ '!/slice/permissions': { where, order } },
						'applications',
						{
							'!/slice/permissions_lite': {
								where: appWhere,
								order
							}
						},
						'all',
						{ $_: '*' }
					]
				},
				{ labelAs: `slices.templateSlices:${parent}` }
			)
			.pipe(
				map((r) => ({
					templates: r.templates.rows || [],
					applications: r.applications.rows || []
				}))
			);
	}

	appsForMailingList() {
		const where = [
			'$and',
			['$empty', ['$field', 'parent']],
			// legacy slices with meta.presentation.fields
			[
				'$or',
				['$contains', ['$field', 'meta'], `"validation":"Email"`], // ensure you update hasMailingListData also
				['$contains', ['$field', 'meta'], `"validation":"Phone"`],
				['$contains', ['$field', 'meta'], `"validation":"Mobile"`]
			]
		];
		return this._api
			.request<{ rows: SliceRow[] }>(
				{ '$/slice/permissions_lite': { where } },
				{ labelAs: 'slices.appsForMailingList' }
			)
			.pipe(map((r) => r.rows.sort(sortObjectArrayByProperty('name'))));
	}

	// mailingLists() {
	// 	const where = ['$and', ['$eq', ['$field', 'category'], 'mailinglist']];
	// 	return this._api
	// 		.request<{rows: SliceRow[]}>({'$/slice/permissions_lite': {where}}, {labelAs: 'slices.mailingLists'})
	// 		;
	// }

	public _saveExisting(slice: SliceRow) {
		delete slice.parent;
		return this._api
			.request<{ slice: SliceRow; testQuery?: any }>(
				{ '$/slice/modify': { slice } },
				{ labelAs: `slices.modify:${slice.id}` }
			)
			.pipe(
				map((resp) => resp.slice),
				tap((s) => {
					this._rawSliceCache.delete(s.id);
					this._sliceCache.delete(s.id);
				}),
				switchMap((s) => this.fetch(s.id)),
				catchError((err) => {
					console.warn('error saving existing', { slice, err });
					return of<Slice>(null);
				}),
				tap((s) => (s ? this._sliceModified(s) : null))
			);
	}

	public _saveColumnMod(slice: any) {
		delete slice.parent;
		return this._api
			.request<{ slice: SliceRow; testQuery?: any }>(
				{ '$/usertable/modColumns': slice },
				{ labelAs: `slices.modColumns` }
			)
			.pipe(
				map((resp) => resp.slice),
				tap((s) => {
					this._rawSliceCache.delete(s.id);
					this._sliceCache.delete(s.id);
				}),
				switchMap((s) => this.fetch(s.id)),
				catchError((err) => {
					console.warn('error saving existing', { slice, err });
					return of<Slice>(null);
				}),
				tap((s) => (s ? this._sliceModified(s) : null))
			);
	}
	saveUpdatedWidth(sliceReq: any) {
		const req = {
			'$/slice/modify': { slice: sliceReq }
		};
		return this._api.request(req);
	}

	refreshCache() {
		this._sliceCache.clear();
	}

	private _saveNew(slice: SliceRow) {
		delete slice.id;
		return this._api
			.request<SliceRow>(
				{ '$/slice/inherit': slice },
				{ labelAs: `slices.inherit:${slice.parent}` }
			)
			.pipe(
				switchMap((s) => this.fetch(s.id)),
				catchError((err) => {
					console.warn('error saving new', { slice, err });
					return of<Slice>(null);
				}),
				tap((s) => (s ? this._sliceCreated(s) : null))
			);
	}

	canCreateMailingLists(slices: SliceRow[]): boolean {
		return slices.some((s) => !s.parent && s.perms?.share);
	}

	isMailingList(slice: SliceRow): boolean {
		return slice.category === SLICE_CATEGORY.MAILING_LIST;
	}

	hasMailingListData(slice: SliceRow, forEdit?: boolean): boolean {
		// the meta does NOT exist on sliceRow, fml
		if (forEdit && !slice?.perms?.modify) {
			return false;
		}
		return Object.values(
			(slice?.meta?.presentation as JotMetaPresentation)?.fields || {}
		)
			.map((f) => f?.validation)
			.some(
				(v) => v && (v === 'Email' || v === 'Phone' || v === 'Mobile')
			);
	}

	private _sliceRemoved(id: number) {
		this.changes.emit({ removed: [id] });
	}

	private _sliceModified(slice: Slice) {
		this.changes.emit({ modified: [slice] });
	}

	private _sliceCreated(slice: Slice) {
		this.changes.emit({ created: [slice] });
	}
}
