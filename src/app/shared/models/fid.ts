import { Relationship, Slice } from './slice';
import { JsonSerializeable } from './base';
import { ValidatorFn, Validators } from '@angular/forms';
import { JotMetaPresentationFields } from './jot';
import { makeSortValue }  from '../utils/makeSortValue';

export enum TRIGGER_MAGIC {
	CREATED_BY  = 'creatorRef',
	CREATED_DATE = 'created',
	ID = 'id',
	MODIFIED_BY = 'modifierRef',
	MODIFIED_DATE = 'modified',
}
export const ALL_BUT_ID_ARRAY = [TRIGGER_MAGIC.CREATED_DATE, TRIGGER_MAGIC.CREATED_BY, TRIGGER_MAGIC.MODIFIED_BY, TRIGGER_MAGIC.MODIFIED_DATE];

export type RenderHint = 'date' | 'datetime' | 'string' | 'number' | 'boolean';

export interface FidStoreOption {
	value: any;
	label: any;
	compare?: string;
}
export type FidEditor = 'dropdown' | 'radio' | 'textbox' | 'textarea' | 'numberbox' | 'date' | 'datetime' | 'time' | 'checkbox';

export interface LegacyAssetJsonRow {_v: any, _l: any};
export type LegacyAssetJson = LegacyAssetJsonRow[];

export interface FidStore {
	enableNotInList?: boolean;
	options?: FidStoreOption[];
	fetch?: {
		url: string;
		headers?: any;
		transform?: (...args: any[]) => FidStoreOption[];
	}
	query?: {
		slice: number;
		labelExpr: string;
		valueField?: string; // defaults to 'id'
		fields?: any;
		where?: any;
		order?: any;
		params?: any;
	},
	asRadio?: boolean;
}

export interface Fid {
	active: number;
	audit: number;
	col: string;
	db: string;
	encrypt: number;
	formula: number;
	formulaDef: string;
	hierarchy: number;
	id: number;
	protected: number;
	relation: number;
	renderHint: RenderHint;
	sliceId: number;
	table: string;
	triggerMagic?: TRIGGER_MAGIC; // @@TODO
	typeRef: number;

	hintText?: string;

	min?: number; // strumber
	max?: number; // strumber

	// gets referenced by the Slice class
	relationships?: Relationship[];
}

export class Fid extends JsonSerializeable<Fid> {


	private _validatorFn!: ValidatorFn[];

	label!: string;

	optionLabel!: string;

	required!: boolean; // this SHOULD get moved into Fid interface (when FId stuff is done)

	textarea!: {
		minRows?: number;
		maxRows?: number;
	};

	store!: FidStore;

	editor!: FidEditor;

	get emptyOperator() {
		switch (this.renderHint) {
			case 'boolean':
			case 'number':
				return '$empty';
			case 'string':
				return '$emptystring';
			case 'date':
			case 'datetime':
				return '$emptydate';
			default:
				console.warn('unhandled type/renderHint', this.renderHint);
				return '$empty';
		}
	}

	constructor(
		private _slice: Slice,
		params?: Fid,
		jot?: JotMetaPresentationFields,
	) {
		super(params);
		if (jot) {
			// if (params.col === 'date') {
			// 	debugger;
			// }
			this._fromJot(jot);
		}
	}

	get validators() {
		const fn = this._validatorFn || (this._validatorFn = []);
		if (!fn) {
			if (this.min) {

			}
			if (this.max) {

			}
			if (this.required) {
				fn.push(Validators.required);
			}
		}
		return fn;
	}

	private _fromJot(all: JotMetaPresentationFields) {

		const jot = all?.[this.col],
			rel = this.relation,
			parent = jot?.parent ? all[jot.parent] : null,
			special = ('' + (jot?.special || '')).trim().toLowerCase();

		if (!jot) { return; }

		let label = jot?.text || this.col || `${this.id}`;

		// required?
		if (jot?.required) {
			this.required = !!(jot.required === 'Yes');
		}

		// @@RADIO
		// @FILE
		// @something...

		// checkbox jiggity
		if (this.renderHint === 'number' && parent) {
			this.editor = 'checkbox';
			if (parent.text) {
				label = parent.text;
				this.optionLabel = jot.reportLabel;
			}
		// textarea
		} else if (this.renderHint === 'string' && jot?.type === 'control_textarea') {
			this.editor = 'textarea';
			this.textarea = {
				minRows: 0,
				maxRows: 25,
			}
		// dropdowns (and related)
		} else if (jot?.type === 'control_dropdown' || jot?.type === 'control_related_dropdown') {
			const enableNotInList = jot?.allowAddOption === 'Yes';
			this.editor = 'dropdown';

			if (jot.type === 'control_related_dropdown') {

				this.store = {
					enableNotInList,
					query: {
						slice: +jot.relateToSlice,
						valueField: 'id',
						labelExpr: jot.displayFormula,
						where: jot.displayWhere, // this is stored in the context of myself... so, the relationship prefix is likely there
					},
				}
				// if (jot?.text === 'advanced') {
				// 	const rel = this._slice.relationships?.get(Math.abs(this.relation));
				// 	console.log('relationship...', jot, this.store, rel);
				// 	debugger;
				// }
			} else if (special && special !== 'none') {
				this.store = {
					enableNotInList,
					fetch: {
						url: `/assets/json/${special.replace(/\s/g, '')}.json`,
						transform: this._legacyJsonRowsToFidOptions,
					}
				};

			} else if (jot.options?.length) {
				// @@todo RADIOBUTTON
				this.store = {
					enableNotInList,
					options: this._legacyOptionsToFidOptions(jot.options),
				};
			};
		// datetime explicit
		} else if (this.renderHint === 'datetime') {
			switch (jot.type) {
				case 'control_timetextbox':
					this.editor = 'time';
					break;
				default:
					if (!!(jot.hideDateTime === 'Date')) {
						this.editor = 'time';
					} else if (!!(jot.hideDateTime === 'Time')) {
						this.editor = 'date';
					} else {
						this.editor = 'datetime';
					}
			}
		// date explicit
		} else if (this.renderHint === 'date') {
			this.editor = 'date';

		// textbox
		} else if (this.renderHint === 'string' && jot?.type === 'control_textbox') {
			this.editor = 'textbox';

		// unhandled/fallback
		} else {
			this.editor = 'textbox';
			console.warn(`unhandled renderHint (${this.renderHint}), cannot build editor; falling back to 'textbox'`, {this: this, jot});
		}

		// simple stuff
		this.label = label;
		this.hintText = ('' + (jot.subLabel || '')).trim();
	}

	private _legacyJsonRowsToFidOptions(data: LegacyAssetJsonRow[]): FidStoreOption[] {
		console.log('_legacyJsonRowsToFidOptions', {data});
		return data.map(r => ({
			value: r._v,
			label: r._l,
			compare: makeSortValue(r._l),
		}));
	}

	private _legacyOptionsToFidOptions(data?: string): FidStoreOption[] {
		return ('' + (data || ''))
			.trim()
			.split('|')
			.map(v => (v || '').trim())
			.map(value => ({
				value,
				label: value,
				compare: makeSortValue(value),
			}));

	}
}
