import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { DatePipe } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, Input, Inject, OnDestroy, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { AppService } from '@services/app.service';
import { RecordReplaceParams, RecordService } from '@services/record.service';
import { SliceService } from '@services/slice.service';
import { Optional } from 'ag-grid-community';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter, map, pairwise, shareReplay, startWith, switchMap, take, takeWhile, tap } from 'rxjs/operators';
import { Fid } from '../../models/fid';
import { Slice } from '../../models/slice';

/**
http://sandbox.datalynk:4200/tools/find/52063/date?hideui=true&where=%7B%7D&userparams=%7B%7D&slice=52068&selected=%5B%5D
 */

export interface FindAndReplaceParams {
	slice: number | Slice;
	column: number;
}

interface FormValue {
	find: string;
	findMatch: 'all' | 'exact' | 'partial';
	replace: string;
	replaceExpr?: string;
	replaceMatch: 'exact' | 'partial' | 'expression' | 'transform';
	replaceTransform?: 'uppercase' | 'lowercase' | 'capitalize';
	selected: number[];
	cloneBefore: boolean;
	cloneAfter: boolean;
	cloneReplaceOnly: boolean;
}

export interface FindAndReplaceResponse {
	selected: number[],
	changed: number[],
}

@Component({
  selector: 'app-find-and-replace',
  templateUrl: './find-and-replace.component.html',
  styleUrls: ['./find-and-replace.component.scss'],
  providers: [DatePipe]
})
export class FindAndReplaceComponent<T> implements OnInit, OnDestroy {

	private _destroyed = false;

	private _sliceId = new BehaviorSubject<number>(0);

	private _changedKeys = new Set<number>();

	private _slice = this._sliceId
		.pipe(
			filter(s => !!s),
			switchMap(id => this._slices.fetchRoot(id))
		);

	private _fid = new BehaviorSubject<number>(0);

	private _renderHint!: string;

	private _forceQueryOnSlice!: number;

	form = new UntypedFormGroup({

		find: new UntypedFormControl(),
		findMatch: new UntypedFormControl('exact'),

		replace: new UntypedFormControl(),
		replaceMatch: new UntypedFormControl('exact'),
		replaceExpr: new UntypedFormControl(),
		replaceTransform: new UntypedFormControl('uppercase'),

		selected: new UntypedFormControl([]),

		cloneBefore: new UntypedFormControl(),
		cloneAfter: new UntypedFormControl(),
		cloneReplaceOnly: new UntypedFormControl(),
	})

	@Input() allRows = false;

	// optional params that will get hitched with the outgoing find/replace requests
	@Input() userParams!: any;

	// slice id or Slice object
	@Input() set slice(slice: number | Slice) {
		this._sliceId.next(typeof slice === 'number' ? slice : slice.id);
	};
	get slice() {
		return this._sliceId.getValue();
	}

	// which field are we operating on?
	@Input() set column(fid: number) {
		this._fid.next(fid);
	};

	// value to find
	@Input() find!: T;

	// value to replace
	@Input() replace!: T;

	// legacy datalynk grid that this *may* be attached to
	@Input() grid: any; // this is the legacy grid.. not sure what it's used for yet

	// the selected id's (legacy)
	@Input() set selected(sel: number[] | null) {
		this.form.get('selected').setValue(sel);
	}
	get selected() {
		return this.form?.get('selected').value || [];
	}

	// are we cloning the records BEFORE replacement?
	@Input() set cloneBefore(cBefore: any) {
		this.form.get('cloneBefore').setValue(coerceBooleanProperty(cBefore));
	};

	// are we cloning the records AFTER replacement?
	@Input() set cloneAfter(cAfter: any) {
		this.form.get('cloneAfter').setValue(coerceBooleanProperty(cAfter));
	};

	// are we ONLY replacing on the cloned rows?
	@Input() set replaceClonedOnly(only: any) {
		this.form.get('cloneReplaceOnly').setValue(coerceBooleanProperty(only));
	};


	advancedDescription = this.form.valueChanges
		.pipe(
			map(v => !!(v.cloneBefore || v.cloneAfter || v.cloneReplaceOnly)),
			distinctUntilChanged(),
			shareReplay(1),
		);

	fid = combineLatest([
		this._slice,
		this._fid,
	])
	.pipe(
		map(([slice, fid]) => slice.fids[fid]),
		tap(fid => console.log('fid', fid)),
		shareReplay(1),
	);

	// any instances where partial should be disabled?
	// - relationships
	// - dates and times
	// - boolean
	disablePartial = this.fid
		.pipe(
			map(fid => !!(fid.relation || fid.renderHint !== 'string')),
		);

	private _formValue = this.form.valueChanges
		.pipe(
			map(v => v as FormValue),
		);


	disableFind = this._formValue
		.pipe(
			map(v => !!(v.findMatch === 'all')),
		);


	renderHint = this.fid
		.pipe(
			map(fid => fid?.renderHint),
		);

	// toggle for the replace portion
	replaceWithExpr = false;

	@Output() selectedKeys: EventEmitter<number[]> = new EventEmitter();

	@Output() changedKeys: EventEmitter<number[]> = new EventEmitter();


	urlSlice = this._route.paramMap
		.pipe(
			map(params => +params.get('slice')),
			filter(s => !!s && s > 0),
			tap(s => this._sliceId.next(s)),
		);

	urlField = this._route.paramMap
		.pipe(
			map(params => params.get('field')),
			filter(f => !!f),
		);

	@Input() where!: any;

	constructor(
		private _slices: SliceService,
		private _route: ActivatedRoute,
		private _records: RecordService,
		public app: AppService,
		private _cd: ChangeDetectorRef,
		private datePipe: DatePipe
	) { }

	get formValue(): FormValue {
		return this.form.getRawValue();
	}

	doFind(selected?: boolean) {
		this.fid
			.pipe(
				take(1),
				map(fid => this._generateFindParams(fid, selected)),
				switchMap(p => this._records.queryIds<number>(this._forceQueryOnSlice || this.slice, p)),
			)
			.subscribe(resp => {
				console.warn('selected updated', this.form.get('selected').value);
				this.form.get('selected')?.setValue(resp.keys || []);
				this._cd.detectChanges();
				this.app.notify.inform(`find_returned_x_results`, 'x', {}, {x: resp.count || 0});
			});
	}

	doReplace(selected?: boolean) {
		const raw = this.formValue,
			keys = raw?.selected || [];
		if (!selected) {
			this.app
				.confirm({
					message: `confirm_replace_all`,
					translate: true,
				})
				.pipe(
					takeWhile(() => !this._destroyed),
					take(1),
					filter(r => !!r)
				)
				.subscribe(() => this._replace(keys, selected));
		} else  if (keys?.length) {
			this._replace(keys, selected);
		} else {
			this.app.notify.warn('Unable to replace selected when none are selected', 'x', {}, true);
		}
	}

	// confirmation has taken place at this point
	private _replace(selected: number[], findSelected?: boolean, closeWhenDone?: boolean) {
		this.fid
			.pipe(
				take(1),
				map(fid => this._generateReplaceParams(fid, selected)),
				switchMap(p => this._records.replace(this.slice, p)),
			)
			.subscribe(resp => {
				const changed = this._changedKeys,
					keys = resp.keys;

				if (keys) {
					keys.forEach(key => changed.add(key));
					this.changedKeys.emit(keys)
					this.app.notify.successForReplace('x_records_updated', 'x', {}, {x: keys.length});

					// clear our "selected" (or, select our new rows??)
					this.form.get('selected').setValue([]);

					// let everything else bubble/resolve, then lets signal our update.
					setTimeout(() => {
						parent?.postMessage(JSON.stringify({replacedvalues: new Date().getTime()}), '*');

						if (closeWhenDone) {
							this.close();
						}
					}, 1);
				} else {
					this.app.notify.successForReplace('x_records_updated', 'x', {}, {x: 0});
				}
			});
	}

	close() {
		parent?.postMessage(JSON.stringify({findandreplaceclose: true}), '*');
	}

	ngOnDestroy() {
		this._destroyed = true;
	}

	formulaChange(val = '') {
		const c = this.form.get('replaceExpr');
		const saved = c?.value || '';
		if (val !== saved) {
			c.setValue(val);
		}
	}

	ngOnInit(): void {

		const params = new URLSearchParams(location.search),
			selectedControl = this.form.get('selected');

		params.forEach((val, key) => {
			if (val !== '{}' && val !== '[]') {
				switch (key) {
					case 'slice':
						this._forceQueryOnSlice = JSON.parse(val) || null;
						break;
					case 'selected':
						this.selected = JSON.parse(val) || [];
						break;
					case 'where':
						this.where = JSON.parse(val);
						break;
					case 'userparams':
						this.userParams = JSON.parse(val);
						break;
				}
			}
		});

		console.log('findAndReplace parsed queryparams::\n\n', {
			forceQuery: this._forceQueryOnSlice,
			selected: this.selected,
			where: this.where,
			userparams: this.userParams,
		});

		this.form.valueChanges
			.subscribe(v => console.log('form changed', v));

		combineLatest([
				this.urlSlice,
				this.urlField,
				this._slice,
			])
			.pipe(
				takeWhile(() => !this._destroyed),
				map(([sliceId, field, slice]) => slice.fidById(field)),
				filter(f => !!f),
			)
			.subscribe(fid => {
				if (this._fid.getValue() !== fid.id) {
					this.column = fid.id;
				}
			});

		this._formValue
			.pipe(
				startWith(this.form.value),
				takeWhile(() => !this._destroyed),
			)
			.subscribe(v => this._checkFormValue(v))

		// inform anything listening of the selection change
		selectedControl.valueChanges
			.pipe(
				startWith(selectedControl.value),
				takeWhile(() => !this._destroyed),
				map(val => [... new Set(val || [])] as number[]),
				pairwise(),
				filter(([p, c]) => JSON.stringify(p) !== JSON.stringify(c)),
				map(([p, c]) => c),
			)
			.subscribe(selectionchange => {
				 // emit to ourself
				this.selectedKeys.emit(selectionchange);

				// and emit to any external listeners
				// dojo/datalynk
				const payload = {selectionchange};
				console.log('POSTMESSAGE->', {payload, json: JSON.stringify(payload)});
				parent?.postMessage(JSON.stringify(payload), '*');
			});


	}



	private _checkFormValue(v = this.form.value) {
		const find = this.form.get('find');

		if (v.findMatch === 'all') {
			find.disable({emitEvent: false});
		} else {
			find.enable({emitEvent: false});
		}
	}

	private _generateReplaceParams(fid: Fid, inKeys: number[] = []) {

		const raw = this.formValue,
			valAsNumber = +raw.replace,
			findParams = this._generateFindParams(fid, !!inKeys.length),
			params: RecordReplaceParams = {
				in: inKeys,
				field: fid.col,
				value: raw.replace,
				clone: {
					before: !!raw.cloneBefore,
					after: !!raw.cloneAfter,
					replace: !!raw.cloneReplaceOnly,
				},
				where: findParams.where,
				userparams: findParams.userparams,
			};

		switch (raw.replaceMatch) {
			case 'transform':
				switch (raw.replaceTransform) {
					case 'capitalize':
						params.value = ['$capitalize', ['$field', fid.col]];
						break;
					case 'lowercase':
						params.value = ['$lcase', ['$field', fid.col]];
						break;
					case 'uppercase':
						params.value = ['$ucase', ['$field', fid.col]];
				}
				break;
			case 'exact':
				if (!raw.replace && valAsNumber !== 0) {
					params.value = null;
				}
				break;
			case 'expression':
				params.value = {$excel: raw.replaceExpr};
				break;
			case 'partial':
				params.value = ['$replace', ['$field', fid.col], raw.find, raw.replace];
				break;
		}


		return params;
	}

	private _generateFindParams(fid: Fid, selected?: boolean) {
		const val = this.formValue,
			find = '' + (val.find || ''),
			where: any[] = ['$and'],
			field = ['$field', fid.col],
			empty = !!(!find && find !== '0'),
			paramWhere = this.where,
			userparams = this.userParams || null;

		// ask the window for the default query
		// const defaultQuery = window.postMessage
		switch (val.findMatch) {
			case 'all':
				where.push([true]);
				break;
			case 'exact':
				if (empty) {
					where.push([fid.emptyOperator, field])
				} else {
					switch (fid.editor) {
						case 'datetime':
							where.push(
								this._generateDateWhere(field, val.find),
								this._generateTimeWhere(field, val.find)
							);
							break;
						case 'date':
							where.push(this._generateDateWhere(field, val.find));
							break;
						case 'time':
							where.push(this._generateTimeWhere(field, val.find));
							break;
						default:
							where.push(['$eq', field, val.find]);
					}
				}
				break;
			case 'partial':
				if (empty) {
					// empty partial matches are treated as explicit empty checks
					where.push([fid.emptyOperator, field]);
				} else {
					where.push(['$contains', ['$concat', '', field], val.find]);
				}
				break;
		}

		// hitch the parameterized where in (if need be)
		if (paramWhere) {
			return {
				where: ['$and', paramWhere, where],
				userparams,
			};
		} else {
			return {
				where,
				userparams,
			};
		}
	}

	private _generateDateWhere(field: any, val: any) {
		if (!val) {
			return ['$empty_date', ['$field', field]];
		} else {
			return ['$eq', ['$date', field], ['$date', this.datePipe.transform(val, 'yyyy/MM/dd')]];
		}
	}

	private _generateTimeWhere(field: any, val: any) {
		if (!val) {
			return ['$empty_date', ['$field', field]];
		} else {
			return ['$and',
				['$eq', ['$hour', field], Number(this.datePipe.transform(val, 'HH'))],
				['$eq', ['$minute', field], Number(this.datePipe.transform(val, 'mm'))]
			];
		}
	}

}
