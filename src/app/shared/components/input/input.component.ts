import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Component, OnInit, ChangeDetectionStrategy, Input, ViewChild } from '@angular/core';
import { AbstractControl, FormControl } from '@angular/forms';
import { MatSelect } from '@angular/material/select';
import { FetchService } from '@services/fetch.service';
import { RecordService } from '@services/record.service';
import { combineLatest, Observable } from 'rxjs';
import { debounceTime, map, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';
import { Fid, FidStoreOption } from '../../models/fid';
import { makeSortValue } from '../../utils/makeSortValue';
import { searchStringToArray, searchStringToRegexArray } from '../../utils/searchStringToArray';


@Component({
	selector: 'dl-input',
	templateUrl: './input.component.html',
	styleUrls: ['./input.component.scss'],
	
})
export class InputComponent implements OnInit {




	@Input() fid!: Fid;


	@Input() control!: FormControl | AbstractControl;


	// instructs the ui to ignore any validation rules that may be attached
	@Input() set novalidate(val: any) {
		this._noValidate = coerceBooleanProperty(val);
	} get novalidate() { return this._noValidate; }
	get booleanLabel() { return this.fid?.optionLabel || ''; }
	private _noValidate = false;


	// when true, disables any "WHERE" params from attaching on outgoing requests..
	@Input() set nofiltering(val: any) {
		this._nofiltering = coerceBooleanProperty(val);
	}
	get nofiltering() { return this._nofiltering; };
	private _nofiltering = false;



	@Input() set hideLabel(val: any) {
		this._hideLabel = coerceBooleanProperty(val);
	} get hideLabel() { return this._hideLabel; }
	private _hideLabel = false;


	// when true, forces it to introspect on itself for value pulling instead of
	// targetting the related(or whatever) slice
	@Input() set selflookup(val: any) {
		this._selflookup = coerceBooleanProperty(val);
	}
	get selflookup() { return this._selflookup; };
	private _selflookup = false;


	// debounce time in MS for the typematic search
	@Input() debounceMs = 500;



	// used internally to managed the "filtering select" stuff
	autocompleteControl!: FormControl;


	// a store that feeds the autocomplete/filtering controls
	dropdownRows: Observable<FidStoreOption[]>;


	// binding for the mat-select that holds our dropdown stuff
	@ViewChild('dropdown', {read: MatSelect, static: false}) dropdown!: MatSelect;


	// allows you to override the label property
	@Input() label!: string;


	@Input() set hideHint(hide) {
		this._hideHint = coerceBooleanProperty(hide);
	}
	get hideHint() { return this._hideHint; }
	private _hideHint = false;

	constructor(
		private _fetch: FetchService,
		private _records: RecordService,
	) { }

	dropdownKeyDown(evt: KeyboardEvent) {
		const d = this.dropdown;
		if (d) {
			switch (evt.key.toLowerCase()) {
				case 'arrowdown':
					d.open();
					break;
				case 'arrowup':
					d.open();
					break;
				case 'escape':
					d.close();
					break;
			}
		}
	}

	ngOnInit(): void {
		const store = this.fid.store,
			control = this.control;

		if (store && control) {

			const initVal = control.value,
				debounce = this.debounceMs;

			this.autocompleteControl = new FormControl(initVal);

			// standard option list
			if (store.options) {
				this.dropdownRows = this.autocompleteControl.valueChanges
					.pipe(
						startWith(initVal),
						debounceTime(debounce),
						map(v => searchStringToRegexArray(v)),
						map(arr => this._filterOptionStoreByRegexArray(store.options, arr)),
					);

			// fetch from external URL
			} else if (store.fetch) {
				const f = store.fetch;
				this.dropdownRows = combineLatest([
					this._fetch
						.getJson(f.url, {headers: f?.headers}, [])
						.pipe(
							map(data => f.transform ? f.transform(data) : data)
						),
					this.autocompleteControl.valueChanges
						.pipe(
							startWith(initVal),
							debounceTime(debounce),
							map(v => searchStringToRegexArray(v))
						),
				])
				.pipe(
					shareReplay(1),
					map(([data, search]) => this._filterOptionStoreByRegexArray(data as FidStoreOption[], search)),
				);

			// backend query (related)
			} else if (store.query) {
				const q = store.query,
					valueKey = '_value',
					labelKey = '_label',
					valueExpr = {$excel: `"" & ${q.valueField ? `{${q.valueField}}` : '{id}'}`},
					labelExpr = {$excel: `"" & ${q.labelExpr || '{id}'}`},
					where = this.nofiltering ? null : this._expandWhere(q.where),
					qry = {
						fields: Object.assign({}, q.fields, {
							[valueKey]: valueExpr,
							[labelKey]: labelExpr,
						}),
						where,
						order: q.order || [['$field', labelKey], ['$field', valueKey]],
						params: q.params || null,
					};

				this.dropdownRows = this.autocompleteControl.valueChanges
					.pipe(
						startWith(initVal),
						debounceTime(debounce),
						map(v => searchStringToArray(v)),
						switchMap(arr => {
							if (where) {
								console.warn('@@@@todo');
							} else if (arr?.length) {
								qry.where = ['$and', ... arr.map(v => ['$contains', ['$field', labelKey], v])];
							} else {
								qry.where = null;
							}
							return this._records.query<{[valueKey]: any, [labelKey]: any}>(q.slice, qry);
						}),
						map(rows => rows.map(row => ({
							value: row?.[valueKey],
							label: row?.[labelKey],
							compare: rows?.[labelKey] ? makeSortValue(row[labelKey]) : '',
						}))),
					);
			} else {
				console.warn('unknown store...', {store, control, this: this});
				debugger;
			}

		}

	}

	private _filterOptionStoreByRegexArray(data: FidStoreOption[], reArr: RegExp[]): FidStoreOption[] {
		if (reArr?.length) {
			return data.filter(row => reArr.every(re => re.test(row.compare)))
		} else {
			return data;
		}
	}

	private _expandWhere(where: any): any[] {
		const prot = Object.prototype.toString.call(where);
		// remember, the thing is in the context of itself, so we need to know more stuff
		switch (prot) {
			case '[object String]':
				if (where.length) {
					return [{$excel: `${where}`}];
				}
				break;
			default:
				console.warn('unhandled', {where, prot});
				debugger;
		}
		return [];
	}


}
