import {
	AfterViewInit,
	Directive,
	ElementRef,
	HostBinding,
	Input,
	OnDestroy,
	OnInit,
	ViewChild,
} from "@angular/core";
import { AbstractControl, FormControl, FormGroup } from "@angular/forms";
import {
	ICellEditor,
	ICellEditorParams,
	ICellRendererParams,
} from "ag-grid-community";
import { takeWhile } from "rxjs/operators";
import { Fid } from "src/app/shared/models/fid";
import { TranslatePipe } from "src/app/shared/pipes/translate.pipe";
import { FORM_MODE } from "../form.defs";
import { DlControlBase } from "../models/control";

@Directive()
export class ControlBase<T extends DlControlBase>
	implements OnInit, OnDestroy, AfterViewInit, ICellEditor
{
	FORM_MODE = FORM_MODE;

	@Input() params: T;
	@Input() formGroup: FormGroup;
	@Input() mode: FORM_MODE;
	control: AbstractControl;

	@ViewChild("focusNode", { read: ElementRef, static: false })
	focusNode: ElementRef<HTMLInputElement | HTMLTextAreaElement>;

	protected _destroyed = false;

	@HostBinding("class.inline") inline = false;
	@HostBinding("class.control-base") void = true;

	constructor(
		private _el: ElementRef // private _host: Host,
	) {}

	ngAfterViewInit() {
		// if this is a grid edit, force the focus in once this event has stopped
		if (this.inline) {
			setTimeout(() => this.focusIn(), 0);
		}
	}

	ngOnInit(): void {
		const p = this.params,
			fg = this.formGroup;

		if (p && fg && !this.control && p.id) {
			this.control = fg.get(p.id);
		}

		if (!this.control) {
			throw "uhhhh, you messed up bro";
		}
	}

	ngOnDestroy() {
		this._destroyed = true;
	}

	getTranslatedErrorMessage(control = this.control) {
		const errors = control.errors,
			trans = TranslatePipe.instance;
		let code: string, args: any;
		if (errors?.required && control.value) {
			code = "required";
			args = true;
		} else if (!!errors) {
			Object.entries(errors).some(([key, val]) => {
				code = key;
				args = val;
				return true;
			});
		}
		return trans.transform(`form_validation_fail_${code}`, args || {});
	}

	// GRID requested methods..
	// https://www.ag-grid.com/javascript-grid-cell-editor/

	getValue() {
		// console.log('getvalue', this.control.value);
		return this.control.value;
	}

	// setValue(v: T) {
	// 	console.log('set value', v);
	// }

	agInit(p: (ICellEditorParams | ICellRendererParams) & { fid?: Fid }) {
		// this will get called BEFORE ngOnInit, so, set anything ahead of time that may be required by it
		const c = this.control || (this.control = new FormControl()),
			colDef = p.colDef;

		this.inline = true; // strips out the rest of the junk (for controls that support it)

		// create our standardized params object
		this.params = {
			label: colDef.headerName,
		} as T;

		// set our initial value
		c.setValue(p.value);
		c.markAsPristine();

		// when the ngcontrol change updates, inform the grid
		this.control.valueChanges
			.pipe(takeWhile(() => !this._destroyed))
			.subscribe((v) => {
				if ("setValue" in p) {
					p.setValue(v);
				} else {
					p.value = v;
				}
			});

		// can we infer any validators from this "Fid"?
	}

	afterGuiAttached() {
		this.focusNode?.nativeElement?.focus();
	}

	focusIn() {
		// this.focusNode?.nativeElement?.focus();
	}
}
