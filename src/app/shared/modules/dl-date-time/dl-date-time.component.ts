import { FocusMonitor } from "@angular/cdk/a11y";
import { coerceBooleanProperty } from "@angular/cdk/coercion";
import {
	Component,
	OnInit,
	ChangeDetectionStrategy,
	Input,
	OnDestroy,
	HostBinding,
	Optional,
	Self,
	ElementRef,
	ViewChild,
} from "@angular/core";
import {
	ControlValueAccessor,
	FormControl,
	FormGroup,
	NgControl,
} from "@angular/forms";
import { MatFormFieldControl } from "@angular/material/form-field";
import { AppService } from "@services/app.service";
import { Subject } from "rxjs";
import { map, takeWhile } from "rxjs/operators";
import { FORM_MODE } from "src/app/form/form.defs";
import { DlControlBase } from "src/app/form/models/control";
import { timeStringToDate } from "./timeStringToDate";

interface FormValue {
	date?: Date;
	time?: Date;
}

@Component({
	selector: "dl-date-time",
	templateUrl: "./dl-date-time.component.html",
	styleUrls: ["./dl-date-time.component.scss"],
	providers: [{ provide: MatFormFieldControl, useExisting: DlDateTime }],
})
export class DlDateTime
	implements
		OnInit,
		OnDestroy,
		MatFormFieldControl<Date>,
		ControlValueAccessor
{
	static nextId = 0;
	static warned = {
		placeholder: false,
	};

	private _destroyed = false;

	controlType = `dl-date-time`;

	@HostBinding() id = `${this.controlType}-${DlDateTime.nextId++}`;

	@ViewChild("dateInput", { static: true, read: ElementRef })
	dateInput: ElementRef<HTMLInputElement>;

	@ViewChild("timeInput", { static: true, read: ElementRef })
	timeInput: ElementRef<HTMLInputElement>;

	// describe by/aria stuffs
	@Input("aria-describedby") userAriaDescribedBy: string;
	setDescribedByIds(ids: string[]) {
		// console.warn('@@todo');
		// const controlElement = this._el.nativeElement
		//   .querySelector('.example-tel-input-container')!;
		// controlElement.setAttribute('aria-describedby', ids.join(' '));
	}

	@Input("mode")
	mode: FORM_MODE;

	@Input("params")
	params: DlControlBase;

	stateChanges = new Subject<void>();

	form: FormGroup;

	@Input()
	get value(): Date | null {
		return this._value;
	}
	set value(date: Date | null) {
		if (date) {
			this.form.setValue({
				date,
				time: date,
			});
		} else {
			this.form.setValue({
				date: null,
				time: null,
			});
		}
		this.stateChanges.next();
	}

	private get _value(): Date | null {
		const raw = this.form.getRawValue() as FormValue;
		let d = null;
		let t = null;

		if (raw.date) {
			d = new Date(raw.date);
		}
		if (raw.time) {
			t = new Date(raw.time);
		}

		if (raw.date && raw.time) {
			d.setHours(
				t.getHours(),
				t.getMinutes(),
				t.getSeconds(),
				t.getMilliseconds()
			);
			return d;
		} else if (this.hideTime && !!d) {
			return d;
		} else if (this.hideDate && !!t) {
			return t;
		}
		return null;
	}

	get placeholder() {
		return this._placeholder;
	}
	set placeholder(ph) {
		this._placeholder = ph;
		if (!DlDateTime.warned.placeholder && ph) {
			console.warn(
				"placeholder is currently not supported, but it may in the future, so feel free to use it"
			);
			DlDateTime.warned.placeholder = true;
		}
		// this.stateChanges.next();
	}
	private _placeholder: string;

	// focused
	focused = false;

	// empty
	get empty(): boolean {
		const v = this.form.getRawValue() as FormValue;
		return !v.date && !v.time;
	}

	// shouldLabelFloat
	@HostBinding("class.floating")
	get shouldLabelFloat() {
		return true;
		// return this.focused || !this.empty;
	}

	// required - ignored, we don't label ourselves...
	@Input()
	get required() {
		return this._required;
	}
	set required(req) {
		(this._required = coerceBooleanProperty(req)), this.stateChanges.next();
	}
	private _required = false;

	// disabled
	@Input()
	get disabled(): boolean {
		return this._disabled;
	}
	set disabled(value: boolean) {
		const f = this.form;
		this._disabled = coerceBooleanProperty(value);
		this._disabled ? f.disable() : f.enable();
		this.stateChanges.next();
	}
	private _disabled = false;

	get errorState(): boolean {
		const c = this.ngControl,
			touched = c?.touched,
			f = this.form;

		if (!touched || (!f.errors && !c.errors)) {
			return false;
		}
		return true;
	}

	@Input() timeFormat = "h:mm a";

	@Input() dateFormat = "M/d/y";

	@Input() bothFormat = `${this.dateFormat} ${this.timeFormat}`;

	@Input() widths: [string, string] = ["60%", "40%"];

	@Input()
	set hideDate(hide: boolean) {
		this._hideDate = coerceBooleanProperty(hide);
		this.stateChanges.next();
	}
	get hideDate() {
		return this._hideDate;
	}
	private _hideDate = false;

	@Input()
	set hideTime(hide: boolean) {
		this._hideTime = coerceBooleanProperty(hide);
		this.stateChanges.next();
	}
	get hideTime() {
		return this._hideTime;
	}
	private _hideTime = false;

	onContainerClick(ev: MouseEvent) {
		// console.log('@@todo focus on the date input...');
	}

	writeValue(val: Date | null) {
		// console.log('writevalue', val);
		this.value = val;
	}

	private _onChange: (fn: any) => void;
	registerOnChange(fn: any) {
		this._onChange = fn;
	}

	private _onTouched: (fn?: any) => void;
	registerOnTouched(fn?: any) {
		this._onTouched = fn;
	}

	// @Input()
	// dateClass: (d: Date) => string | string[] | null = d => { return null; };

	// @Input()
	// dateFilter: (d: Date) => boolean = d => true;

	constructor(
		@Optional() @Self() public ngControl: NgControl,
		_fm: FocusMonitor,
		_el: ElementRef<HTMLElement>,
		public app: AppService
	) {
		this.form = new FormGroup({
			date: new FormControl(),
			time: new FormControl(),
		});

		_fm.monitor(_el.nativeElement, true)
			.pipe(takeWhile(() => !this._destroyed))
			.subscribe((origin) => {
				this.focused = !!origin;
				if (this._onTouched) {
					this._onTouched();
				}
				this.stateChanges.next();
			});

		if (this.ngControl !== null) {
			this.ngControl.valueAccessor = this;
		}
	}

	dateKeyDown(event: KeyboardEvent, elem: HTMLInputElement) {
		const code = event.key.toLowerCase(),
			up = code === "arrowup",
			down = code === "arrowdown",
			control = this.form.get("date"),
			value = control.value,
			start = elem.selectionStart,
			end = elem.selectionEnd,
			increment = value ? (up ? 1 : -1) : 0;

		if (up || (down && up !== down)) {
			console.log("keydown", { up, down, increment });
			event.stopImmediatePropagation();
			event.preventDefault();

			const newDate = new Date(value);
			newDate.setDate(value.getDate() + increment);
			control.setValue(newDate);
			elem.selectionStart = start;
			elem.selectionEnd = end;
			// console.log('setvalue', newDate);
		}
	}

	showAndFocus(show: HTMLInputElement, hide: HTMLInputElement) {
		hide.style.display = "none";
		show.style.removeProperty("display");
		show.focus();
		show.selectionStart = 0;
		show.selectionEnd = show.value?.length || 0;
	}

	blur(show: HTMLInputElement, hide: HTMLInputElement) {
		show.style.removeProperty("display");
		hide.style.display = "none";
	}

	setDateTime(setDate?: boolean, time?: string) {
		const f = this.form;
		if (setDate) {
			f.get("date").setValue(new Date());
		}
		if (time) {
			this.timeChange(time);
		}
	}

	timeChange(time: string) {
		const t = timeStringToDate(time),
			control = this.form.get("time");
		console.log("timechange", { time, t });
		if (time && t === false) {
			console.warn("invalid format", time);
		}
		control.setValue(t || null);
		this.ngControl.control.setValue(t || null);
	}

	ngOnDestroy() {
		this.stateChanges.next();
		this._destroyed = true;
	}

	ngOnInit(): void {
		const form = this.form,
			date = form.get("date");

		form.valueChanges.pipe(map((v) => this._value)).subscribe((v) => {
			console.log("change", v);
			this.stateChanges.next();
			this._emitChange(v);
		});

		if (this.params) {
			switch (this.params.hideDateTime) {
				case "Time":
					this.hideTime = true;

					break;
				case "Date":
					this.hideDate = true;
					break;
				default:
					break;
			}

			switch (this.params.allowAMPM) {
				case "Yes":
					break;
				case "No":
					switch (this.params.allowSecond) {
						case "Yes":
							this.timeFormat = "HH:mm:ss";
							break;
						case "No":
						default:
							this.timeFormat = "HH:mm";
							break;
					}

					break;
				default:
					break;
			}
		}
	}

	private _emitChange(value = this._value || null) {
		if (this._onChange) {
			this._onChange(this._value || null);
		}
	}
}
