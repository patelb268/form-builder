import {
	Component,
	ChangeDetectionStrategy,
	OnInit,
	ChangeDetectorRef,
	ElementRef
} from '@angular/core';
import { ControlBase } from '../control-base';
import {
	DlRelatedDropdownControl,
	OptionRow,
	OptionRowValue
} from '../../models/control';
import { searchStringToArrayPipe } from 'src/app/shared/utils/searchStringToArray';
import { takeWhile, tap, switchMap, map, filter, take } from 'rxjs/operators';
import { Observable, Subject, of, ReplaySubject, race } from 'rxjs';
import { ApiService } from '@services/api.service';
import { FormGroup, AbstractControl } from '@angular/forms';
import { Expression } from 'src/app/shared/models/expression';
import { DOUBLE_CURLY_BRACES } from 'src/app/shared/utils/regex';
import { query } from '@angular/animations';
import { SliceService } from '@services/slice.service';
import { Router } from '@angular/router';
import { RoutingService } from '@services/routing.service';
import { FORM_MODE } from '../../form.defs';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

@Component({
	selector: 'app-control-related-dropdown',
	templateUrl: './control-related-dropdown.component.html',
	styleUrls: ['./control-related-dropdown.component.scss']
})
export class ControlRelatedDropdownComponent
	extends ControlBase<DlRelatedDropdownControl>
	implements OnInit
{
	filteredRows = new Subject<OptionRow[]>();
	fetching = new ReplaySubject<boolean>(1);
	limit = 250;
	firstFetch = true;
	result = [];
	relatedFormId = null;

	private _requiresFetch = true;
	private _requiresValidation = false;

	constructor(
		private _api: ApiService,
		private _cd: ChangeDetectorRef,
		private _elem: ElementRef,
		private router: Router,
		private _routing: RoutingService,
		private sliceService: SliceService
	) {
		super(_elem);
	}

	ngOnInit() {
		super.ngOnInit();

		const where = this.params?.query?.where as string,
			form = this.control.parent;

		this.control.valueChanges
			.pipe(
				filter((v) => typeof (v || '') === 'string'),
				tap(() => {
					this.filteredRows.next(null);
					this.result = [];
					this.fetching.next(true);
				}),
				takeWhile(() => !this._destroyed),
				tap(() => (this._requiresFetch = false)),
				searchStringToArrayPipe(),
				switchMap((terms) => this._query(terms)),
				tap(() => this.fetching.next(false))
			)
			.subscribe((rows) => {
				this.filteredRows.next(rows);
				this.result = rows;
			});

		this.params._notInListValidation = (val) => {
			if (this._requiresValidation && (val || val === 0)) {
				return this._validate().pipe(
					tap(() => (this._requiresValidation = false))
				);
			} else {
				console.log('NIL?', val);
				return of(!(typeof (val || '') === 'string'));
			}
		};

		// IF there is a query.where, and that has a double curly {{ }},
		// we need to listen to changes in the form, so that if something
		// else is changed, then we are told to re-update from the backend
		// with the new param
		if (DOUBLE_CURLY_BRACES.test(where) && form) {
			const controls: Observable<any>[] = [];
			where.replace(DOUBLE_CURLY_BRACES, (match, field) => {
				const c = form.get(field);
				if (c) {
					controls.push(c.valueChanges);
				}
				return '';
			});
			if (controls.length) {
				race(controls)
					.pipe(takeWhile(() => !this._destroyed))
					.subscribe(() => {
						setTimeout(() => {
							this._requiresValidation = true;
							this.filteredRows.next(null);
							this.result = [];
							this.control.updateValueAndValidity({
								emitEvent: false
							});
							this._cd.detectChanges();
						}, 1);
					});
			}
		}
		this.onFocus();
	}

	ngAfterViewInit() {
		// if this is a grid edit, force the focus in once this event has stopped
		console.log(this.control);

		if (this.mode !== 'add' && this.firstFetch)
			this.control.valueChanges
				.pipe(
					tap(() => this.fetching.next(true)),
					searchStringToArrayPipe(0),
					take(1),
					switchMap((terms) => this._query(terms)),
					tap(() => this.fetching.next(false))
				)
				.subscribe((rows) => {
					this.filteredRows.next(rows);
					this.control.setValue(rows[0]._v);
					this.result = rows;
					this.firstFetch = false;
					this._cd.detectChanges();
				});
	}

	displayFn(row: OptionRowValue) {
		if (row) {
			const data = this.result.find((r) => r._v === row)?._l;
			return data;
		}
		return '';
	}

	onFocus() {
		of(this.control.value)
			.pipe(
				tap(() => this.fetching.next(true)),
				searchStringToArrayPipe(0),
				take(1),
				switchMap((terms) => this._query(terms)),
				tap(() => this.fetching.next(false))
			)
			.subscribe((rows) => {
				this.filteredRows.next(rows);
				this.result = rows;
				this._cd.detectChanges();
			});
		this._requiresFetch = false;
	}

	onSelectedOptionChange(event: MatAutocompleteSelectedEvent){
		this.control.setValue(event.option.value);
	}

	private _validate(): Observable<boolean> {
		const q = this.params.query,
			val = (this.control.value as OptionRow)?._v,
			w = ['$eq', ['$field', '_v'], val];

		let where = this._addQueryWhereContext(q.where as string);

		if (where) {
			where = ['$and', w, where];
		} else {
			where = w;
		}
		console.log('validate!', where);
		return this._api
			.report<OptionRow>(q.slice, {
				fields: { _v: q.value },
				where,
				limit: 1
			})
			.pipe(map((resp) => !!resp.rows.length));
	}

	routeToRelatedForm(control) {
		if (this.mode === FORM_MODE.VIEW && control.value) {
			let url = this.router
				.createUrlTree([
					this._routing.formViewRecord(
						this.params.query.slice,
						this.relatedFormId,
						control.value
					)
				])
				.toString();
			this.router.navigateByUrl(url);
		}
	}

	private _query(terms: string[], isDirect = false): Observable<OptionRow[]> {
		if (this.result.length) {
			return of(this.result);
		}
		const params = this.params,
			query = params.query,
			_l = query.label,
			_v = query.value,
			order = [['$field', 'id']],
			limit = this.params.limit || this.limit,
			searchWhere = terms.map((t) => ['$contains', ['$field', 'id'], t]);

		let where = this._addQueryWhereContext(query.where as string);

		if (terms && terms.length) {
			if (!where) {
				where = ['$and', ...searchWhere];
			} else {
				where = ['$and', where, ...searchWhere];
			}
		}

		this.sliceService.fetch(query.slice).subscribe((t) => {
			this.relatedFormId =
				this.sliceService.getDefaultFormIdFromSliceDetail(t);
		});
		return this._api
			.report<OptionRow>(query.slice, {
				where,
				limit,
				order,
				fields: {
					_l,
					_v
				}
			})
			.pipe(map((resp) => resp.rows));
	}

	private _addQueryWhereContext(where: string): Expression {
		const parent = this.control.parent as FormGroup,
			record = (parent ? parent.value : {}) as object;
		if (where) {
			return {
				$excel: where.replace(DOUBLE_CURLY_BRACES, (match, p1) => {
					if (record[p1] || record[p1] === 0) {
						return JSON.stringify(record[p1]?._v || record[p1]);
					} else if (record.hasOwnProperty(p1)) {
						return null;
					} else {
						console.warn(
							'unable to find the reference value in the record',
							{ record, match }
						);
						return '';
					}
				})
			};
		}
		return null;
	}
}
