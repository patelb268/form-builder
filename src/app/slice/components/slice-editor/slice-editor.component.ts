import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppService } from '@services/app.service';
import { combineLatest, Observable, BehaviorSubject, of, ReplaySubject } from 'rxjs';
import { map, tap, switchMap, filter, debounceTime, distinctUntilChanged, takeWhile, catchError, startWith, shareReplay } from 'rxjs/operators';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { SliceRow, SLICE_CATEGORY, Slice, Meta, MetaExpressions, SliceQueryParams } from 'src/app/shared/models/slice';
import { SliceService, SliceChangesEvent, postQueryTransformFn } from '@services/slice.service';
import { JotFieldDef, JotMetaPresentation } from 'src/app/shared/models/jot';
import { GridSerialized } from 'src/app/shared/components/grid/ag-grid.lib';
import { AgGridComponent } from 'src/app/shared/components/grid/ag-grid.component';
import { TranslatePipe } from 'src/app/shared/pipes/translate.pipe';
import { ALL_BUT_ID_ARRAY } from 'src/app/shared/models/fid';
import { Location } from '@angular/common';
import { sortObjectArrayByProperty } from 'src/app/shared/utils/sortObjectArrayByProperty';
import { MatDialog } from '@angular/material/dialog';
import { IconDialogComponent } from 'src/app/shared/components/icon-dialog/icon-dialog.component';

interface IFields {
	single?: boolean;
	label?: string;
	filter?: (f: JotFieldDef) => boolean;
}
interface FieldsAvailable {
	id: string;
	label?: string;
}

@Component({
	selector: 'app-slice-editor',
	templateUrl: './slice-editor.component.html',
	styleUrls: ['./slice-editor.component.scss'],
	
})
export class SliceEditorComponent implements OnInit, OnDestroy {

	loading = new BehaviorSubject(true);

	CATEGORIES = SLICE_CATEGORY;

	applications: Observable<SliceRow[]>;
	error?: string;
	fields: IFields = {};
	fieldsAvailable = new BehaviorSubject<FieldsAvailable[]>([]);
	gridPreview = true;
	previewCount: number;
	title: string;
	canPreviewFn: (() => boolean)[];
	@ViewChild('previewGrid', {read: AgGridComponent, static: false}) previewGrid: AgGridComponent;
	previewGridSerialized: GridSerialized = {
		disable: {},
	};
	saving = new ReplaySubject<boolean>(1);
	previewReady = new BehaviorSubject<boolean>(false);

	generalMeta = new UntypedFormGroup({
		icon: new UntypedFormControl(),
	});

	form = new UntypedFormGroup({
		id: new UntypedFormControl(0),
		category: new UntypedFormControl(null, [Validators.required]),
		name: new UntypedFormControl(null, [Validators.required, Validators.maxLength(128)]),
		parent: new UntypedFormControl(null, [Validators.required]), // at this time, creation of a new application slice is disabled
		meta: new UntypedFormControl(null),
		query_params: new UntypedFormGroup({
			fields: new UntypedFormControl({value: null, disabled: true}, [Validators.required]),
			where: new UntypedFormControl(),
		}, {updateOn: 'blur'}),
	}, {updateOn: 'blur'});

	canPreview = combineLatest([
		this.form
			.valueChanges
			.pipe(
				startWith(this.form.getRawValue()),
				debounceTime(500),
				map(() => {
					console.log('canpreview??');
					if (!this.gridPreview) {
						return false;
					}
					const f = this.form,
						raw = f.getRawValue(),
						can = !!(
							(raw.parent || raw.id)
						);
					if (can && this.canPreviewFn) {
						return this.canPreviewFn.every(fn => fn.apply(this));
					} else {
						return can;
					}
				}),
		),
		this.previewReady.pipe(filter(x => !!x))
	])
	.pipe(
		map(([v, rdy]) => v && rdy),
		distinctUntilChanged(),
		shareReplay(1),
	);

	postQueryTransformFn!: postQueryTransformFn;


	private _destroyed = false;
	private _parentSlice = new BehaviorSubject<Slice>(null);

	constructor(
		public app: AppService,
		private _route: ActivatedRoute,
		private _slices: SliceService,
		private _cd: ChangeDetectorRef,
		private _location: Location,
		private _dialog: MatDialog,
	) { }

	// this is an optional meta data adjustment you can set on individual
	// editor instances to perform any last second tweaks
	getMetaData: () => Meta;

	mutateSliceBeforeSave: (slice: SliceRow) => void;

	submit() {
		const form = this.form,
			val = form.getRawValue() as SliceRow;

		if (this.getMetaData) {
			val.meta = this.getMetaData();
		} else {
			Object.assign(val.meta, this.generalMeta.getRawValue() || {});
		}

		if (typeof val?.query_params?.where === 'string') {
			val.query_params.where = {$excel: val.query_params.where};
		}

		this.saving.next(true);

		if (this.mutateSliceBeforeSave) {
			this.mutateSliceBeforeSave(val);
		}

		console.log('Saving..', val);

		this._slices
			.save(val)
			.subscribe(resp => {
				const trans = TranslatePipe.instance,
					msg = trans.transform('x_saved', {x: trans.transform(val.category)});

				this.app.notify.success(msg);
				this.saving.next(false);
				this.form.markAsPristine();

				if (resp.id && resp.id !== val.id) {
					this._location.replaceState(`/edit/${resp.id}`);
				}
				this._location.back();

			}, err => {
				this.app.notify.warn('error_saving_slice');
				this.saving.next(false);
			})
	}

	makeObjectPair(key: string) {
		return {[key]: key};
	}

	ngOnDestroy() {
		this._destroyed = true;
		this.form.reset();
	}

	ngOnInit(): void {

		const route = this._route,
			form = this.form,
			qp = form.get('query_params'),
			parent = form.get('parent');

		parent
			.valueChanges
			.pipe(
				startWith(parent.value),
				takeWhile(() => !this._destroyed),
				tap(() => qp.disable()),
				switchMap(p => this._slices.fetch(p)),
			)
			.subscribe(par => {
				this._parentSlice.next(par);
				// the filter may not be set at this point..
				const fil = this.fields.filter,
					legacyFields = (par?.meta?.presentation as JotMetaPresentation)?.fields;

				if (fil) {
					if (legacyFields) {
						this.fieldsAvailable.next(Object
								.entries(legacyFields)
								.filter(([k, v]) => fil(v))
								.map(([k, v]) => ({
									id: k,
									label: v.reportLabel || v.formLabel
								}))
								.sort(sortObjectArrayByProperty('label'))
							);
					} else {
						// likely, we'll generate based on par.fids

						console.warn('unable to load legacy field defs', {par, filter});
						this.app.notify.warn('error_loading_field_types');
						return;
					}
				}
				qp.enable();
			});

		this._slices.changes
			.pipe(
				takeWhile(() => !this._destroyed),
			)
			.subscribe((changes: SliceChangesEvent) => {

				const raw = this.form.getRawValue(),
					id = raw?.id,
					par = raw?.parent,
					rem = new Set(changes.removed || []);

				if (
					(id && rem.has(id))
					|| (par && rem.has(par))
				) {
					this.app.notify.warn('no_longer_available');
					this._reset();
				}
			});

		combineLatest([
			this.app.auth,
			route.data.pipe(map(d => d as SliceRow)),
			route.paramMap
				.pipe(
					map(p => +p.get('id')),
					switchMap(id => id && id > 0 ? this._slices.fetch(id) : of<Slice>(null)),
					catchError(err => of<Slice>(null)),
				)
			]).subscribe(([auth, data, fetchedSlice]) => {
				this._reset();
				if (data && Object.keys(data || {}).length) {
					this._load(data);
				} else if (fetchedSlice) {
					this._load(fetchedSlice.rawInitRow);
				} else {
					this.error = 'error_slice_not_found';
					this._cd.detectChanges();
				}
			});
	}

	private _reset() {
		this.error = null;
		this.postQueryTransformFn = null;
		this.previewReady.next(false);
		this.form.reset();
		this.applications = null;
	}

	private _load(sliceRow: SliceRow) {

		const data = Object.assign({}, sliceRow);
		// load the value in BEFORE hand.. so the controls are populated?

		this._convertQueryParams(data.query_params, data.meta?.expressions);

		const qp = Object.assign({}, data?.query_params || {});

		if (data.parent) {

			const form = this.form;

			delete data.query_params;

			// we need to delay the preview until everything is ready

			const sub = combineLatest([
				this._parentSlice
					.pipe(
						filter(s => !!s)
					),
				form.get('parent').valueChanges
					.pipe(
						filter(v => !!v) // why are we filtering it?
					)
			])
			.subscribe(([par, val]) => {
				const qpForm = form.get('query_params');
				qpForm.patchValue(qp);
				form.markAsPristine();
				sub.unsubscribe();
			});
		}



		this.generalMeta.patchValue(data?.meta || {});
		this.generalMeta.markAsPristine();

		let obs: Observable<any>;

		// clear our meta caller if it exists
		if (this.getMetaData) {
			this.getMetaData = null;
		}

		switch (data.category) {
			case SLICE_CATEGORY.MAILING_LIST:
				obs = this._loadMailingList(data, qp);
				break;
			default:
				console.warn('unsupported category', {data});
				throw 'whoops';
		}
		if (obs) {
			obs.subscribe(() => {
				this.previewReady.next(true);
				this.loading.next(false);
			});
		}

		this.form.patchValue(data);
		this.form.markAsPristine();

		if (!sliceRow.id) {
			this.loading.next(false);
		}

	}

	private _loadMailingList(data: SliceRow, queryParams: SliceQueryParams): Observable<any> {

		const form = this.form,
			fields = this.fields,
			qp = form.controls.query_params, // if loading, this will NOT be what we expect
			serialized = this.previewGridSerialized;

		this.applications = this._slices.appsForMailingList();

		fields.single = true;
		fields.filter = f => f.validation === 'Email' || f.validation === 'Phone' || f.validation === 'Mobile';
		// what if they are pointing at the email/mobile in the all user/auth table?
		fields.label = 'recipient_column';

		this.canPreviewFn = [
			this._onlyOneField,
			this._fieldsInParent,
		];

		serialized.disable.header = true;
		serialized.readonly = true;

		// this.postQueryFilterFn = this._filterUniqueRowsOnFieldFactory()

		const obs = combineLatest([
			this._parentSlice.pipe(filter(s => !!s)),
			qp.get('fields')
				.valueChanges
				.pipe(
					distinctUntilChanged(),
				),
		])
		.pipe(
			takeWhile(() => !this._destroyed)
		);

		obs.subscribe(([parentSlice, f]) => {
			const key = Object.keys(f || {})?.shift(),
				where = qp.get('where'),
				whereValue = {$excel: `({${key}}<>NULL)`},
				fid = key ? parentSlice?.fidById(key) : false,
				whereControl = this.form.get(['query_params', 'where']);

			if (key) {
				serialized.columns = Object.assign({}, parentSlice.fidsAsGridColumns(ALL_BUT_ID_ARRAY, {lockPinned: true}));
				serialized.columnOrder = ['id'];
				const col = serialized.columns[key];
				if (col) {
					col.pinned = 'left';
					col.lockPosition = true;
				} else {
					console.warn('ummmmm, what?', serialized);
				}

				// does the field exist in our 'fids'?
				if (!whereControl.touched) {
					whereControl.setValue(fid ? where.value : null);
					whereControl.markAsPristine();
				} else if (fid) {
					this.app.confirm({
						message: TranslatePipe.instance.transform('confirm_replace_where', {value: whereValue.$excel}),
					}).pipe(
						filter(x => !!x)
					)
					.subscribe(x => {
						whereControl.setValue(whereValue);
						whereControl.markAsPristine();
					});
				};

				// create our post filtering mechanism
				this.postQueryTransformFn = this._filterUniqueRowsOnFieldFactory(key);

			} else {
				serialized.columns = null;

				// clear our post filtering mechanism
				this.postQueryTransformFn = null;
			}
		});

		form.get('category').setValue(data.category);
		form.markAsPristine();

		// mailing list slices do NOT preserve the rest of their meta data,
		// and, this only exists because of auto-conversion to s-expression
		// on the backend.  the issue has been brought up to greg, but, i'm
		// uncertain as to the timeline for a fix/adapter
		this.getMetaData = () => {
			const w = form.get(['query_params', 'where'])?.value,
				expressions = {
					'query_params.where': (typeof w === 'string' ? w : w?.$excel) || null,
				};
			return Object.assign({}, this.generalMeta.getRawValue() || {}, {expressions});
		};

		return obs;
	}

	singleFieldSelected(opt: any, val: any): boolean {
		if (!val) { return false; };
		const selectedField = Object.values(val).shift();
		if (selectedField) {
			return opt.hasOwnProperty(selectedField);
		}
		return false;
	}

	openIconPicker() {
		this._dialog
			.open(IconDialogComponent, {
				data: {
					value: this.generalMeta?.value?.icon as string,
				},
			})
			.afterClosed()
			.subscribe((icon: false | string) => {
				const c = this.generalMeta.get('icon');
				if (icon === false) {
					c.setValue(null);
					c.markAsDirty();
				} else if (icon) {
					c.setValue(icon);
					c.markAsDirty();
				}
				this._cd.detectChanges();
			});
	}

	// ensures that only a single field exists in the query_params.fields
	private _onlyOneField(): boolean {
		const fields = this.form?.get('query_params')?.value?.fields || {};
		return Object.keys(fields).length === 1;
	}

	// ensures that every field defined in query_parms.fields is a valid column (available from parent)
	private _fieldsInParent(): boolean {
		const slice = this._parentSlice.getValue(),
			fields = this.form?.getRawValue().query_params?.fields || {};
		if (slice) {
			return Object
				.keys(fields)
				.every(field => !!(slice.fidById(field)));
		} else {
			return false;
		}
	}

	// this is called before setting the form values.  tweak anything before form.setValue,
	// but, make sure they are "generics" only - anything specific to a particular slice category
	// should be done in its own block to avoid contamination
	private _convertQueryParams(qp: any, expr: MetaExpressions = {}) {

		// fields
		this._convertQPFields(qp?.fields || {});

		// where
		if (qp?.where) {
			if (qp.where?.$excel) {
				qp.where = qp.where.$excel;
			} else if (expr['query_params.where']) {
				console.info('falling back meta.expressions:query_params.where', expr['query_params.where']);
				qp.where = expr['query_params.where'];
			}
		}
		return qp;
	}

	// same as above, keep it to the generics here, fields specifically
	private _convertQPFields(fields: any) {
		const prot = Object.prototype.toString.call(fields);
		if (prot === '[object Object]') {
			Array.from(Object.entries(fields))
				.forEach(([field, expr]) => { // this converts {foo: ['$field', 'foo']} to {foo: 'foo'}
					if (
						Object.prototype.toString.call(expr) === '[object Array]'
						&& expr[0] === '$field' && expr[1] === field
					) {
						fields[field] = field;
					}
				});
		} else {
			console.warn('unknown fields format, unable to convert');
		}
	}

	// a factory function that provides an after query filtering mechanism
	// to the preview grid
	private _filterUniqueRowsOnFieldFactory<T>(field: string): postQueryTransformFn {
		return rows => {
			// find distinct values, then replace with the first match found
			return Array
				.from(new Set(rows.map(r => r[field])))
				.map(fieldValue => rows.find(r => r[field] === fieldValue));
		};
	}

}
