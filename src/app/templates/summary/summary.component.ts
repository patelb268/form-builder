import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '@services/api.service';
import { AppService } from '@services/app.service';
import { FormService } from '@services/form.service';
import { SliceService } from '@services/slice.service';
import { head } from 'lodash';
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
	FORM_MODE,
	FORM_ERROR_CODES,
	FormParams
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
}

@Component({
	selector: 'app-summary',
	templateUrl: './summary.component.html',
	styleUrls: ['./summary.component.scss']
})
export class SummaryComponent implements OnInit, OnDestroy {
	private _destroyed = false;
	selectedTab = null;
	loading = new BehaviorSubject(true);
	error?: FORM_ERROR_CODES;
	formParams: FormParams;
	tabButtons = [
		'Editor',
		'Source Editor',
		'PDF Preview',
		'Preview',
		'Settings'
	];
	editAppSlice: number;
	templates = [];

	constructor(
		public app: AppService,
		private _slices: SliceService,
		private _route: ActivatedRoute,
		private _cd: ChangeDetectorRef,
		private _forms: FormService,
		private _api: ApiService,
		private router: Router
	) {}

	ngOnInit() {
		this.selectedTab = head(this.tabButtons);
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
								.fetch(p.get('slice'), {
									includeRootMeta: true
								})
								.pipe(
									map(
										(s) =>
											({
												slice: s,
												record: +p.get('record'),
												formId: p.get('form'),
												form: s.getFormContainer(
													p.get('form')
												),
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
			.subscribe((p) => this._load(p));
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
		this.loadTemplates();
	}

	loadTemplates() {
		this._slices.getAllSliceDetailWithMeta().subscribe((y: any[]) => {
			// const templates = navData.filter(y=>y.category ==='template' && y.parent === this.formParams.slice.id);
			if (y && y.length) {
				const data = y[1].rows;
				this.templates = data.filter(
					(y) =>
						y.category === 'template' &&
						y.parent === this.formParams.slice.id
				);
				this._cd.detectChanges();
			}
		});
	}

	openTemplate(template) {
		this.router.navigate(
			['templates/' + this.formParams.slice.id + '/edit/' + template.id],
			{ state: { data: template } }
		);
	}

	private _clear() {}

	createTemplate() {
		this.router.navigate([
			'templates/' + this.formParams.slice.id + '/new'
		]);
	}

	ngOnDestroy() {
		this._destroyed = true;
	}
}
