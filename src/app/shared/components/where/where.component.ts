import { Component, OnInit, ChangeDetectionStrategy, Input, forwardRef, OnDestroy, ViewChild, ChangeDetectorRef, ElementRef, Injector } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormControl, NgControl } from '@angular/forms';
import { takeWhile, debounceTime, switchMap, tap, map, shareReplay } from 'rxjs/operators';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { ThemePalette } from '@angular/material/core';
import { MatButton } from '@angular/material/button';
import { SliceService } from '@services/slice.service';
import { Subject, Observable } from 'rxjs';
import { Fid } from '../../models/fid';

@Component({
	selector: 'app-where',
	templateUrl: './where.component.html',
	styleUrls: ['./where.component.scss'],
	
	providers: [{
		provide: NG_VALUE_ACCESSOR,
		useExisting: forwardRef(() => WhereComponent),
		multi: true,
	}]
})
export class WhereComponent implements OnInit, OnDestroy, ControlValueAccessor {

	@ViewChild('fieldsButton', {read: MatButton, static: false}) fieldsButton: MatButton;
	@ViewChild('textareaElement', {read: ElementRef, static: true}) textareaElement: ElementRef<HTMLTextAreaElement>;

	control: FormControl;

	@Input() label: string;
	@Input() placeholder: string;
	@Input() minRows = 1;
	@Input() maxRows = 25;
	@Input() debounceMs = 250;

	@Input() set slice(slice: number) {
		this._sliceId = slice;
		this._paramsChanged.next();
	}
	get slice() { return this._sliceId; }

	@Input() set disableFields(disable: boolean) {
		this._disableFields = coerceBooleanProperty(disable);
		this._paramsChanged.next();
	}
	get disableFields() { return this._disableFields; }

	@Input() set disableRelated(disabled: boolean) {
		this._disabledRelated = coerceBooleanProperty(disabled);
		this._paramsChanged.next();
	}
	get disableRelated() { return this._disabledRelated; }

	@Input() iconColor: ThemePalette;

	fetching: NodeJS.Timeout;
	fields: Fid[] = [];
	ngControl: NgControl;

	private _disableFields: boolean;
	private _disabledRelated: boolean;
	private _destroyed = false;
	private _sliceId: number;
	private _paramsChanged = new Subject();
	// private _fieldsCache = new Map<number, Observable<{fields?: Fid[], related?: Fid[]}>>();

	onChange: (val: any) => void = () => {};
	onTouched: () => void = () => {};

	constructor(
		private _cd: ChangeDetectorRef,
		// private _api: ApiService,
		private _slices: SliceService,
		private _inj: Injector,
	) { }

	inject(path: string[]) {
		this.onTouched();
		this._inject(`{${path.join(':')}}`);
	}

	getFields(slice: number) {
		return this._slices
			.fids(slice)
			.pipe(
				map(fids => ({
					fields: fids,
					related: fids.filter(r => !!r.relation)
				})),
			);
	}

	focus() {
		this.onTouched();
	}

	blur() {
		this.onTouched();
	}

	ngOnDestroy() {
		this._destroyed = true;
	}

	ngOnInit(): void {
		const ngControl = this.ngControl = this._inj.get(NgControl),
			updateOn = ngControl.control.updateOn;

		this.control = new FormControl(null, {updateOn});

		this.control.valueChanges
			.pipe(
				takeWhile(() => !this._destroyed)
			)
			.subscribe(v => {
				if (v || v === 0) {
					this.onChange({$excel: v});
				} else {
					this.onChange(null);
				}
			});

		// this._paramsChanged
		// 	.pipe(
		// 		tap(() => {
		// 			this.fields = [];
		// 		}),
		// 		debounceTime(this.debounceMs),
		// 		switchMap(() => this._slices.fetch(this._sliceId)),
		// 		takeWhile(() => !this._destroyed),
		// 	)
		// 	.subscribe();

	}

	registerOnChange(fn: any) {
		this.onChange = fn;
	}

	registerOnTouched(fn: any) {
		this.onTouched = fn;
	}

	setDisabledState(disabled: boolean) {
		const c = this.control;
		if (disabled) {
			c.disable();
		} else {
			c.enable();
		}
	}

	writeValue(value: any) {
		const c = this.control;
		c.setValue(value?.$excel || value || null);
		c.markAsPristine();
	}

	private _inject(str: string) {
		const ta = this.textareaElement.nativeElement;
		ta.setRangeText(str, ta.selectionStart, ta.selectionEnd, 'select');
		this.onChange(ta.value);
	}
}
