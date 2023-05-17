import {
	ChangeDetectorRef,
	Component,
	ElementRef,
	OnInit,
	Renderer2,
	ViewChild
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '@services/api.service';
import { AppService } from '@services/app.service';
import { FormService } from '@services/form.service';
import { RoutingService } from '@services/routing.service';
import { SliceService } from '@services/slice.service';
import { sortBy } from 'lodash';
import { BehaviorSubject, of } from 'rxjs';
import {
	catchError,
	map,
	switchMap,
	take,
	takeWhile,
	tap
} from 'rxjs/operators';
import {
	FormParams,
	FORM_ERROR_CODES,
	FORM_MODE
} from 'src/app/form/form.defs';
import { DlForm } from 'src/app/form/models/container';
import { RoutedFormComponent } from 'src/app/form/routed-form/routed-form.component';
import { JotMetaPresentationForm } from 'src/app/shared/models/jot';
import { Slice } from 'src/app/shared/models/slice';
interface FetchSignature {
	slice?: Slice;
	record?: number;
	formId?: string | number;
	form?: DlForm | JotMetaPresentationForm;
	mode?: FORM_MODE;
	reportId?: any;
}

@Component({
	selector: 'app-sorting-grouping',
	templateUrl: './sorting-grouping.component.html',
	styleUrls: ['./sorting-grouping.component.scss']
})
export class SortingGroupingComponent implements OnInit {
	// fieldCtrl = new FormControl();
	// orderCtrl = new FormControl();
	allFields = [];
	insertField = null;
	sortIterations: any[] = [];
	fieldValues = [];
	orderValues = [
		{ value: 'Ascending (a-z, 0-9)', id: '$asc' },
		{ value: 'Descending (z-a, 9-0)', id: '$desc' },
		{ value: 'Group Ascending (a-z, 0-9)', id: '$asc' },
		{ value: 'Group Descending (z-a, 9-0)', id: '$desc' }
	];
	private _destroyed = false;
	formParams: FormParams;
	error?: FORM_ERROR_CODES;
	loading = new BehaviorSubject(true);
	reportInfoMain: Slice = null;
	reportInfoNonParent: Slice = null;
	navData = new MatTableDataSource([]);
	rolesData = new MatTableDataSource([]);
	editAppSlice: number;

	constructor(
		public app: AppService,
		private _slices: SliceService,
		private _route: ActivatedRoute,
		private router: Router,
		private _cd: ChangeDetectorRef,
		private _forms: FormService,
		private _api: ApiService,
		private _routing: RoutingService,
		private renderer: Renderer2
	) {}

	private _clear() {
		this.formParams = null;
		this.error = null;
	}
	ngOnInit(): void {
		this.app.auth
			.pipe(
				takeWhile(() => !this._destroyed),
				switchMap((auth) =>
					this._route.paramMap.pipe(
						tap(() => {
							this._clear();
							this._cd.detectChanges();
							this.loading.next(true);
						}),
						switchMap((p) =>
							this._slices
								.fetch(p.get('sliceid'), {
									includeRootMeta: true
								})
								.pipe(
									map(
										(s) =>
											({
												slice: s,
												formId: p.get('form'),
												form: s.getFormContainer(
													p.get('form')
												),
												reportId: p.get('reportid'),
												mode: p.get('mode') as FORM_MODE
											} as FetchSignature)
									),
									catchError((err) => {
										this.error =
											FORM_ERROR_CODES.SLICE_NOT_FOUND;
										return of<FetchSignature>({});
									})
								)
						)
					)
				)
			)
			.subscribe((p) => {
				this._load(p);
				this.getAllFields(p);
			});
	}

	private _load(p: FetchSignature) {
		if (p.form) {
			const record = isNaN(p.record) ? 0 : p.record;
			this.formParams = {
				slice: p.slice,
				record,
				mode: !record
					? FORM_MODE.ADD
					: p.mode || RoutedFormComponent.defaultMode,
				form: this._forms.parseForm(p.form, p.slice)
			};
			// console.info('routed-form params\n\n', {slice: this.slice, record: this.record, mode: this.mode, form: this.form});
			if (!this.formParams.form) {
				this.error = FORM_ERROR_CODES.LEGACY_NEEDS_RESAVE;
				this.editAppSlice = p.slice.root?.id || p.slice.id;
				this.formParams = null;
			} else {
				this.error = null;
			}
		} else if (!this.error) {
			this._clear();
		}

		this.loading.next(false);
	}

	private async getAllFields(p: FetchSignature) {
		let navData = (await this._slices.navData().toPromise()).slices;
		let rolesData = (
			await this._slices.getRoles(+this.formParams.slice.id).toPromise()
		).map((u) => u.role);
		let nav = sortBy(
			navData.filter((y) => !y.parent && y.category === 'report'),
			(u) => u.name
		);

		let userTableId = this.app.env.users;
		const blackList = [37976, userTableId];
		const rolesInfo = navData.filter(
			(y) => y.category === 'role' && !blackList.includes(y.id)
		);

		rolesData.forEach((r) => {
			const it: any = rolesInfo.find((y) => y.id === r);
			if (it) {
				it.selected = true;
			}
		});

		this.navData = new MatTableDataSource(nav);

		this.rolesData = new MatTableDataSource(rolesInfo);
		this.reportInfoMain = null;
		if (p.form) {
			const record = isNaN(p.record) ? 0 : p.record;
			this.formParams = {
				slice: p.slice,
				record,
				mode: !record
					? FORM_MODE.ADD
					: p.mode || RoutedFormComponent.defaultMode,
				form: this._forms.parseForm(p.form, p.slice)
			};

			const report = await this._slices
				.fetch(this.formParams.slice.id, {
					includeRootMeta: true
				})
				.toPromise();
			this.reportInfoMain = report;

			this.reportInfoNonParent = await this._slices
				.fetch(p.reportId, {
					includeRootMeta: true
				})
				.toPromise();

			this.setOrderConditions(
				this.reportInfoNonParent.query_params.order
			);
		}
	}

	setOrderConditions(data) {
		data.forEach((element) => {
			const sortOrder = this.orderValues.find((y) => y.id == element[0]);
			const field = element[1][1];
			this.sortIterations.push({
				fieldCtrl: new FormControl({ id: field }),
				orderCtrl: new FormControl(sortOrder.id)
			});
		});
	}

	addSortRow() {
		this.sortIterations.push({
			fieldCtrl: new FormControl(),
			orderCtrl: new FormControl()
		});
	}

	deleteSortRow(index) {
		this.sortIterations.splice(index, 1);
	}

	moveItem(from, to) {
		this.sortIterations.forEach((y) => {
			const field = y.orderCtrl.value;
			console.log(field);
		});
		var f = this.sortIterations.splice(from, 1)[0];
		this.sortIterations.splice(to, 0, f);
	}
}
