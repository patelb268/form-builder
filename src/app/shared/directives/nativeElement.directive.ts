import { Directive, ElementRef, OnInit } from '@angular/core';
import { FormControlName } from '@angular/forms';

// HACK ALERT!  this exposes a .nativeElement attribute on reactive bound formControlName

@Directive({
	// tslint:disable-next-line: directive-selector
	selector: '[formControlName]'
})
export class NativeElementDirective implements OnInit {
	constructor(
		private _elem: ElementRef,
		private _control: FormControlName,
	) {
	}

	ngOnInit() {
		(this._control.control as any).nativeElement = this._elem.nativeElement;
	}
}
