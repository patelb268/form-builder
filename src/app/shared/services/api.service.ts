import { Injectable } from '@angular/core';
import { ApiConfig, Api } from 'auxilium-connect';
import { environment } from 'src/environments/environment';
import { Relationship, SliceRow } from '../models/slice';
import { Fid } from '../models/fid';
import { map } from 'rxjs/operators';
import { HttpClient, HttpEventType } from '@angular/common/http';
import 'socket.io-client';

// needed to get our rigged library in here
type ClassRef<T> = new (config: ApiConfig) => T;
declare global {
	interface Window {
		Api: ClassRef<Api>;
		api: (req: any, cb: (...args: any[]) => void) => void;
	}
}

export interface FetchOptions {
	includeRootMeta?: boolean;
	includeLegacyFormHtml?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService extends window.Api {

	constructor(
		private _http: HttpClient,
	) {
		super(environment.api);
		if (!window.api) {
			window.api = (req, cb) => {
				this.request(req)
					.subscribe(r => (cb || console.log)(r));
			};
		}
	}

	fetch(id: string | number, opt: FetchOptions = {}) {
		id = this._fixSliceId(id);
		const basePath = typeof id === 'string' ? `!/env/${id}` : `!/slice`,
			baseObj = typeof id === 'string' ? {} : {slice: id},
			sliceRef = {$_: 'slice:id', $_else: 0};
		// grab modify, share, and ADD perms
		return this
			.request<{
				slice: SliceRow,
				root?: SliceRow,
				canAdd: {insert: {[field: string]: number[]}},
				fids: {[fid: number]: Fid},
				relations: {outbound: {[id: number]: Relationship}},
			}>({'$/tools/do': [
				'candidate', {[`${basePath}/fetch`]: Object.assign(baseObj)},
				'slice', {'!/slice/permissions_lite': {where: {id: {$_: 'candidate:id'}}}, $pop: 'rows:0'},
				'canAdd', {'!/slice/xperms': {slice: sliceRef, mask: 'i'}},
				'fids', {'!/slice/fid/fieldInfo': {sliceIds: [sliceRef]}},
				'rootId', opt.includeRootMeta ? {'!/slice/root': {slice: sliceRef}} : {},
				'root', opt.includeLegacyFormHtml || opt.includeRootMeta ? {'!/slice/fid/fetch': {slice: {$_: 'rootId'}}} : {},
				'legacyFormHtml', opt.includeLegacyFormHtml ? {'!/datalynk/modules/legacyFormHtmlFromMeta': {meta: {$_: 'root.meta', $_else: null}}} : {},
				'relations', {'!/slice/relations': {slice: sliceRef}},
				'all', {
					slice: {$_: 'slice'},
					canAdd: {$_: 'canAdd'},
					fids: {$_: 'fids'},
					root: {$_: 'root'},
					relations: {$_: 'relations'},
					legacyFormHtml: {$_: 'legacyFormHtml'},
				}
			]}, {labelAs: `fetch.${id}`})
			.pipe(
				map(resp => {
					const slice = resp.slice;
					slice.allRelations = resp.relations;
					slice._meta = {
						fids: resp.fids || {},
						relationships: new Map(Object.entries(resp.relations.outbound).filter(([k, v]) => !!v.name).map(([k, v]) => [+k, v])),
					};
					slice._root = resp.root && resp.root.id ? resp.root : null;
					slice.perms.insert = Object.keys(resp.canAdd.insert);
					// slice.perms
					return slice;
				}),
			);

			
	}

	private _fixSliceId(id: string | number) {
		if (typeof id === 'string' && isNaN(+id)) {
			return id;
		}
		return +id;
	}


	download(file: number | string) {
		const url = typeof file === 'string' ? file : this.getFileUrl(file);
		return this._http
			.get(url, {
				responseType: 'blob',
				reportProgress: true,
				observe: 'events',
			})
			.pipe(
				map(r => {
					if (r.type === HttpEventType.Response && r.headers.has('file-not-found')) {
						return null;
					}
					return r;
				})
			);

	}
}
