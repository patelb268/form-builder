import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	OnInit,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ApiService } from "@services/api.service";
import { AppService } from "@services/app.service";
import { SliceService } from "@services/slice.service";
import { BehaviorSubject, of } from "rxjs";
import {
	catchError,
	map,
	switchMap,
	take,
	takeWhile,
	tap,
} from "rxjs/operators";
import { JotMetaPresentationForm } from "src/app/shared/models/jot";
import { Slice } from "src/app/shared/models/slice";
import { FormService } from "../../shared/services/form.service";
import { FormParams, FORM_ERROR_CODES, FORM_MODE } from "../form.defs";
import { DlForm } from "../models/container";

interface FetchSignature {
	slice?: Slice;
	record?: number;
	formId?: string | number;
	form?: DlForm | JotMetaPresentationForm;
	mode?: FORM_MODE;
}

@Component({
	selector: "form-routed-form",
	templateUrl: "./routed-form.component.html",
	styleUrls: ["./routed-form.component.scss"],
})
export class RoutedFormComponent implements OnInit, OnDestroy {
	static defaultMode = FORM_MODE.VIEW;
	static legacyStaleSourceCache = new Map<number, string>();

	private _destroyed = false;

	ERRORS = FORM_ERROR_CODES;
	formParams: FormParams;
	loading = new BehaviorSubject(true);

	error?: FORM_ERROR_CODES;
	editAppSlice: number;

	constructor(
		public app: AppService,
		private _slices: SliceService,
		private _route: ActivatedRoute,
		private _cd: ChangeDetectorRef,
		private _forms: FormService,
		private _api: ApiService
	) {}

	ngOnDestroy() {
		this._destroyed = true;
	}

	ngOnInit() {
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
								.fetch(p.get("slice"), {
									includeRootMeta: true,
								})
								.pipe(
									map(
										(s) =>
											({
												slice: s,
												record: +p.get("record"),
												formId: p.get("form"),
												form: s.getFormContainer(
													p.get("form")
												),
												mode: p.get(
													"mode"
												) as FORM_MODE,
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
				form: this._forms.parseForm(p.form, p.slice),
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

	private _clear() {
		this.formParams = null;
		this.error = null;
	}

	callApi(request: any) {
		return this._api.request<any>(request).pipe(
			take(1),
			map(
				(res) => {
					return res;
				},
				(err) => {
					console.log(err);
				}
			),
			catchError((err, caught) => {
				if (err === "guest_restricted") {
					this._api.showLogin().subscribe();
				}
				return err;
			})
		);
	}
}
