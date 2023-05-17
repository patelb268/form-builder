import { Component, OnInit, ChangeDetectionStrategy, forwardRef, Input, ChangeDetectorRef, Self, ElementRef, OnDestroy, HostBinding, ViewChild } from '@angular/core';
import { ControlValueAccessor, FormControl, NgControl } from '@angular/forms';
import { MatFormFieldControl } from '@angular/material/form-field';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Subject, Observable } from 'rxjs';
import { Optional } from 'ag-grid-community';
import { FocusMonitor } from '@angular/cdk/a11y';
import { map, takeWhile, startWith } from 'rxjs/operators';
import { MatOption } from '@angular/material/core';
import { searchStringToArrayPipe } from 'src/app/shared/utils/searchStringToArray';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';

@Component({
  selector: 'filter-select',
  templateUrl: './filter-select.component.html',
  styleUrls: ['./filter-select.component.scss'],
  
  providers: [
	{
		provide: MatFormFieldControl,
		useExisting: forwardRef(() => FilterSelectComponent),
		multi: true,
	}
]
})
export class FilterSelectComponent<T> implements OnInit, OnDestroy, ControlValueAccessor, MatFormFieldControl<T> {

	static nextId = 0;

	@HostBinding('attr.aria-describedby') describedBy = '';

	@ViewChild('auto', {read: MatAutocomplete, static: false}) autoComplete: MatAutocomplete;
	@ViewChild('trigger', {read: MatAutocompleteTrigger, static: false}) trigger: MatAutocompleteTrigger;

	controlType = 'filter-select';
	formControl = new FormControl(null, [this._validate.bind(this)]);
	id = `filter-select-${FilterSelectComponent.nextId++}`;
	focused = false;
	errorState = false;
	stateChanges = new Subject<void>();

	@Input()
	get disabled() { return this.formControl.disabled; }
	set disabled(disabled) {
		disabled = coerceBooleanProperty(disabled);
		if (disabled) {
			this.formControl.disable();
		} else {
			this.formControl.enable();
		}
		this.stateChanges.next();
	}

	@Input()
	get value(): T {
		const validationeErr = this._validate(this.formControl);
		if (validationeErr) {
			return null;
		} else {
			return this.formControl.value;
		}
	}
	set value(value: T) {
		this.formControl.setValue(value || '');
		this.stateChanges.next();
	}

	@Input()
	get placeholder() { return this._placeholder; }
	set placeholder(ph: string) {
		this._placeholder = ph;
		this.stateChanges.next();
	}

	@Input()
	get required() {
		return this._required;
	}
	set required(req) {
		this._required = coerceBooleanProperty(req);
		this.stateChanges.next();
	}

	get empty() {
		return !this.formControl.value;
	}

	get shouldLabelFloat() {
		return this.focused || !this.empty;
	}

	@Input() icon = 'arrow_drop_down';
	@Input() debounce = 250;
	@Input() limit = 100;
	@Input() hideIcon = false;
	@Input() allowExpandWhenDisabled = false;

	@Input()
	get options() {
		return this._options;
	}
	set options(options) {

		this._options = options.map(o => {
			if (o.value && !o.search) {
				o.search = ('' + (o.value || '')).toLowerCase();
			}
			return o;
		});
		this.stateChanges.next();
		this._cd.detectChanges();
	}

	@Input()
	get autoActiveFirstOption() {
		return this._autoActiveFirstOption;
	}
	set autoActiveFirstOption(auto) {
		this._autoActiveFirstOption = coerceBooleanProperty(auto);
		this.stateChanges.next();
		this._cd.detectChanges();
	}

	@Input()
	get limitToList() {
		return this._limitToList;
	}
	set limitToList(isLimited) {
		this._limitToList = coerceBooleanProperty(isLimited);
		this.stateChanges.next();
		this._cd.detectChanges();
	}

	filteredOptions: Observable<{value: T, label: string}[]>;

	private _placeholder: string;
	private _required = false;
	private _options: {value: T, label: string, search?: string}[];
	private _destroyed = false;
	private _autoActiveFirstOption = true;
	private _limitToList = true;

	onChange = (value: T) => {};
	onTouched = () => {};

	setDescribedByIds(ids: string[]) {
		this.describedBy = ids.join(' ');
	}

	onContainerClick(evt: MouseEvent) {
		if ((evt.target as Element).tagName.toLowerCase() !== 'input') {
			this._elem.nativeElement.querySelector('input').focus();
		}
	}


	constructor(
		private _cd: ChangeDetectorRef,
		private _fm: FocusMonitor,
		private _elem: ElementRef<HTMLElement>,
		@Optional() @Self() public ngControl: NgControl,
	) {
		if (this.ngControl != null) {
			this.ngControl.valueAccessor = this;
		}
	}

	toggleAutocomplete() {
		setTimeout(() => {
			const trigger = this.trigger,
				opened = trigger.panelOpen;
			if (this.allowExpandWhenDisabled || !this.disabled || opened) {
				if (opened) {
					trigger.closePanel();
				} else {
					trigger.openPanel();
				}
			}
		}, 1);
	}

	ngOnInit(): void {

		this._fm
			.monitor(this._elem.nativeElement, true)
			.pipe(
				takeWhile(() => !this._destroyed),
			)
			.subscribe(o => {
				this.focused = !!origin;
				this.onTouched();
				this.stateChanges.next();
			});

		this.filteredOptions = this.formControl.valueChanges
			.pipe(
				startWith(this.formControl.value || ''),
				searchStringToArrayPipe(this.debounce),
				map(s => this._filterRows(s)),
				takeWhile(() => !this._destroyed)
			);

		this.formControl.updateValueAndValidity();
		// alright, at this point, we need to let the thing know that we are ready to validate...

	}

	ngOnDestroy() {
		this._destroyed = true;
	}

	writeValue(value: T) {
		this.value = value;
	}

	registerOnChange(fn: (value: T) => void): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: () => void): void {
		this.onTouched = fn;
	}

	_onBlur() {
		const err = this.errorState,
			value = this.formControl.value;
		if (err) {
			if (
				typeof value === 'string'
				&& value
			) {
				const s = (value || '').toLowerCase(),
					matches = this._options.filter(o => o.search === s),
					len = matches.length,
					newVal = len ? matches[0].value : null;

				if (len === 1) {
					this.formControl.setValue(newVal);
					this.onChange(newVal);
					this.formControl.updateValueAndValidity();
				} else if (len) {
					console.warn('multiple matches found:', matches);
				}
			}
		}

	}

	_optionSelected(opt: MatOption) {
		this.value = opt.value || null;
		this.onChange(this.value);
	}

	_onInput(val: T) {
		val = val || null;
		this.onChange(val);
	}

	private _validate(control: FormControl) {
		const limit = this.limitToList,
			required = this.required,
			value = control.value,
			hasError = this.errorState;
		if (value) {
			if (limit) {
				const valid = this._isValueInOptions(value);
				if (hasError !== !valid) {
					this.errorState = !valid;
					this.stateChanges?.next();
				}
				return valid ? null : {limitToList: true};
			}
		} else if (required) {
			this.errorState = true;
			this.stateChanges.next();
			return {required: true};
		}
		if (hasError) {
			this.errorState = false;
			this.stateChanges?.next();
		}
		return null;
	}

	private _isValueInOptions(value: T): boolean {

		value = value || null;

		const options = this._options,
			exact = options.some(o => o.value === value);

		return exact;
	}

	private _filterRows(search: any) {
		const max = this.limit,
			available = this._options.length;
		if (search.length) {
			const re = search.map(term => new RegExp(term, 'i')),
				exact = this._options.filter(o => re.every(x => x.test(o.label)));
			if (exact.length < max && available > max && search.length > 1) {
				const partials = this._options.filter(o => !exact.includes(o) && re.some(x => x.test(o.label)));
				return [... exact, ...partials].slice(0, max);
			} else {
				return exact.slice(0, max);
			}
		} else {
			return this._options.slice(0, max);
		}
	}

}
