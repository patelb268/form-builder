import { SliceService } from '@services/slice.service';
import { JotMetaPresentation } from './jot';
import { TranslatePipe } from '../pipes/translate.pipe';
import { JotMetaPresentationForm } from './jot';
import { DlForm } from 'src/app/form/models/container';
import { Fid, TRIGGER_MAGIC } from './fid';
import { GridColumns, SerializedColDef } from '../components/grid/ag-grid.lib';
import { CalendarMeta, LegacyCalendarMeta } from 'src/app/calendar/calendar.defs';

export enum SLICE_CATEGORY {
	ENV = 'env',
	HIDDEN = 'hideOnLeftNav',
	TRIGGER = 'poll',
	TRIGGER_DISABLED = '_disabled_poll',
	NOTIFICATION = 'recurring',
	NOTIFICATION_DISABLED = '_disabled_recurring',
	REPORT = 'report',
	ROLE = 'role',
	RULE = 'rule',
	SUBSCRIPTION = 'recurring_reminder',
	SUBSCRIPTION_DISABLED = '_disabled_recurring_reminder',
	SYSTEM = 'system',
	TEMPLATE = 'template',
	MAILING_LIST = 'mailinglist',
}

export interface Metadata {
	fids: Fids;
	relationships: Relationships;
}



export interface LegacyMetaPresentationGrid {
	cellColor: any[];
	rowColor: any[];
	totals: any[];
	order: any;
}
export interface LegacyMetaPresentation {
	calendar?: LegacyCalendarMeta;
	reportType: string;
	titleBold?: number;
	grid?: LegacyMetaPresentationGrid;
	fields?: {
		[fieldName: string]: {
			grid?: {
				textAlign: any;
				columnOrder?: number;
				width?: number;
				display?: 'none';
			}
		}
	};
	description?: string;
	hideAddRelated?: number;
	hideEdit?: number;
	hideHeader?: number;
	hideHeaderButtons?: number;
	hideHeaderTitle?: number;
	hideOnLeftNav?: number;
	hideView?: number;
	refreshInterval?: number;
	refreshAuto?: number;
	summaryGrid?: number;
	include_in?: any;
	gantt?: any;
	chart?: any;
	pie?: any;
	graph?: any;
	zoneMap?: any;
	map?: any;
	pivot?: any;
	export?: any;
	showDescription?: number;
	hidePrint?: number;
	hideAddRecord?: number;
}

export interface Meta {
	presentation?: JotMetaPresentation | LegacyMetaPresentation | any;
	form?: {[id: string]: DlForm};
	expressions?: MetaExpressions;
	icon?: string;
	// modern
	calendar?: CalendarMeta;
}

export interface MetaExpressions {
	[path: string]: string;
}

export interface Relationship {
	fromCol: string;
	fromFid: number;
	fromSlice: number;
	fromSliceName: string;
	id: number;
	name: string;
	toCol: string;
	toFid: number;
	toSlice: number;
	toSliceName: string;
}

export interface Fids {[fid: number]: Fid; }
export type Relationships = Map<number, Relationship>; // {[realtionId: number]: Relationship};

// not the record level perms, except for add!
export interface SlicePerms {
	insert?: string[];
	modify?: number;
	report?: number;
	share?: number;
}

export type SliceOrderMode = '$asc' | '$desc';
export type SliceOrder = [SliceOrderMode, ['$field', string]] | ['$field', string];

export interface SliceQueryParams {
	slice?: number;
	fields?: {
		[id: string]: any;
	};
	where?: any;
	order?: SliceOrder[];
	group?: SliceOrder[];
}

export interface SliceRow {

	category?: SLICE_CATEGORY | string;
	id?: number;
	modified?: Date;
	name?: string;
	parent?: number;
	perms?: SlicePerms;
	query_params?: SliceQueryParams;
	meta?: Meta;
	role?: string;
	source_pcol?: string;
	source_db?: string;
	source_table?: string;
	allRelations?: any;
	_meta?: Metadata;
	_root?: SliceRow;

}

export interface AdvancedXInsertResponse {
	failed: any[];
	granted?: {
		[submittedId: number]: {
			[fieldName: string]: number; // granting slice
		};
	};
	ignoredFields?: {
		[fieldName: string]: string;
	};
	keys?: {
		[submittedId: number]: number;
	};
	publish?: number;
	tx?: number;
}


export class Slice {

	static SYSTEM_FIELDS = {creatorRef: 'display', modifierRef: 'display'};

	category: string;
	id: number;
	idField: string;
	modified: Date;
	name: string;
	parent: number;
	meta: Meta;
	private _plural = 'Records';
	private _singular = 'Record';
	query_params: SliceQueryParams;

	source_db: string;
	source_table: string;

	root: SliceRow;
	fids: Fids;
	relationships: Relationships;
	allRelations: any;
	perms: SlicePerms;

	private _defaultForm: string | number;
	private _rawInitRow: SliceRow;

	constructor(
		p: SliceRow,
		private _slices: SliceService,
	) {
		const m = p._meta;

		if (p.meta && Object.prototype.toString.call(p.meta) === '[object Array]') {
			p.meta = {};
		}

		this.id = p.id || null;
		this.modified = p.modified;
		this.name = p.name;
		this.parent = p.parent || null;
		this.meta = p.meta;
		this.perms = p.perms || {};
		this.idField = p.source_pcol;
		this.category = p.category;

		this.source_db = p.source_db;
		this.source_table = p.source_table;

		this.query_params = p.query_params;

		this.root = p._root;
		this.relationships = m.relationships;
		this.allRelations = p.allRelations;

		this._processFids(m.fids);

		this._setRecordIdentifiers(this.root);

		// raw is a copy of the original data
		this._rawInitRow = Object.assign({}, p);

	}

	get rawInitRow() {
		return this._rawInitRow;
	}

	fidsAsGridColumns(hideSystem?: TRIGGER_MAGIC[], forceDefault: SerializedColDef = {}) {
		const ret: GridColumns = {},
			blacklist = new Set(hideSystem || []);
		Object
			.values(this.fids)
			.forEach((fid: Fid) => {
				if (fid.triggerMagic && blacklist.has(fid.triggerMagic)) {
					return;
				}
				ret[fid.col] = Object.assign({}, forceDefault, {
					field: Object.assign({}, fid.col), // send a clone
				});
			});
		return ret;
	}

	get defaultLegacyPresentation() {
		return this.meta?.presentation as JotMetaPresentation;
	}

	get defaultFormId() {
		let def = this._defaultForm;
		if (!this._defaultForm) {
			if (this.meta?.form) {
				throw '@@todo';
			} else {
				def = this._defaultForm = Object.keys((this.root?.meta?.presentation as JotMetaPresentation)?.forms || (this.meta?.presentation as JotMetaPresentation)?.forms || {})
					.map(key => +key)
					.pop();
			}
		}
		return def;
	}

	get plural() {
		return TranslatePipe.instance.transform(this._plural);
	}
	get singular() {
		return TranslatePipe.instance.transform(this._singular);
	}

	fidArray(ignoreSystem?: boolean) {
		const pool = Object.values(this.fids) as Fid[];
		if (!ignoreSystem) {
			return pool;
		} else {
			return pool.filter(f => !f.triggerMagic);
		}
	}

	getSortOnField(field: string, order = this.query_params.order) {
		return this._slices.getSortOnField(field, order);
	}
	getGroupOnField(field: string, groups = this.query_params.group) {
		return this._slices.getSortOnField(field, groups);
	}

	fidById(id: string): Fid {
		return Object
			.entries(this.fids)
			.filter(([k, v]) => v.col === id)
			.map(([k, v]) => v)
			.shift();
	}

	getFormContainer(id: string): DlForm | JotMetaPresentationForm {
		console.log('get form container...');
		let meta = this.meta,
			form: DlForm | JotMetaPresentationForm,
			legacyFormId: number | string;

		// check for legacy...
		if (meta?.form && id in meta.form) {
			form = meta.form[id];
		} else if (meta.presentation && 'forms' in meta.presentation) {
			legacyFormId = Object.keys(meta.presentation.forms).shift();
			if (legacyFormId) {
				form = meta.presentation.forms[legacyFormId] as JotMetaPresentationForm;
				form.isLegacy = true; // ensure our legacy bit is set
			}
		}

		if (!form) {
			meta = this.root?.meta;
			if (meta?.form && id in meta.form) {
				form = meta.form[id];
			} else if (meta?.presentation && 'forms' in meta.presentation) {
				legacyFormId = Object.keys(meta.presentation.forms).shift();
				if (legacyFormId) {
					form = meta.presentation.forms[legacyFormId] as JotMetaPresentationForm;
					form.isLegacy = true;
				}
			}
		}

// 		if (this.id === 55648) {
// 			form = {
// 				type: 'form',
// 				unbound: true,
// 				children: [
// 					{
// 						type: 'div',
// 						flex: '0 0 auto',
// 						children: [
// 							{
// 								type: 'dropdown',
// 								label: 'Year',
// 								id: 'yearFilter',
// 								query: {
// 									distinct: true,
// 									value: ['$YEAR',['$field', 'created']],
// 								},
// 							},{
// 								type: 'dropdown',
// 								label: 'Process',
// 								id: '_processFilter',
// 								requires: ['yearFilter'],
// 								query: {
// 									distinct: true,
// 									value: 'PROCESS',
// 									where: `YEAR({created})={yearFilter}`,
// 								}
// 							},{
// 								type: 'dropdown',
// 								label: 'Question',
// 								id: '_questionFilter',
// 								requires: ['yearFilter'],
// 								query: {
// 									distinct: true,
// 									value: 'Requirement',
// 									where: `AND(YEAR({created})={yearFilter},IF({_processFilter},{PROCESS}={_processFilter},true))`,
// 								},
// 							}
// 						],
// 					},
// 					{
// 						id: 'grid',
// 						flex: '1 1 auto',
// 						type: 'grid',
// 						unbound: true,
// 						refreshOn: ['yearFilter', '_processFilter', '_questionFilter'],
// 						requires: ['yearFilter'],
// 						grid: {
// 							slice: 55648,
// 						},
// 						query: {
// 							where: `
// AND(
// 	YEAR({created})={yearFilter},
// 	IF(
// 		{_processFilter},
// 		{PROCESS}={_processFilter},
// 		true
// 	),
// 	IF(
// 		{_questionFilter},
// 		{Requirement}={_questionFilter},
// 		true
// 	)
// )`.replace(/\n|\t/g, '')},
// 					}
// 				],

// 			}
// 		}

		return form;
	}

	private _setRecordIdentifiers(r: SliceRow) {
		if (r && r.meta && (r.meta.presentation as JotMetaPresentation)) {

			const p = r.meta.presentation as JotMetaPresentation,
				form = Object.values(p.forms).shift();

			if (form) {
				if (form.singleItem) { this._singular = form.singleItem; }
				if (form.multipleItem) { this._plural = form.multipleItem; }
			}
		}

		// this.singular = 'FOO';
		// this.plural = 'FOOS';
		// console.log('updated', this.singular, this.plural);
	}

	private _processFids(fids: Fids) {

		const f = this.fids = {},
			ignored: Fids = {},
			rels = this.relationships,
			jot = (this?.root?.meta || this?.meta)?.presentation as JotMetaPresentation;

		Object
			.entries(fids)
			.map(([id, fid]) => [id, fid] as [string, Fid])
			.forEach(([id, fid]) => {
				if (fid.active) {
					f[id] = new Fid(this, fid, jot?.fields);
				} else {
					ignored[id] = fid;
				}
			});
		if (Object.keys(ignored).length) {
			console.warn('ignoring inactive fids', ignored);
		}

		// lets mutate the relationships in now...
		(Array.from(Object.values(this.fids)) as Fid[])
			.forEach(fid => {
				// check for direction relations (this fid is the parent)
				const r = fid.relation ? rels.get(fid.relation) : null;
				if (r) {
					(fid.relationships || (fid.relationships = []))
						.push(r);
				}

				// sort the relationships here?  they should all be added
			})
	}

}
