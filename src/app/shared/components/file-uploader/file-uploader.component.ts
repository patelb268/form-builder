import { Component, OnInit, ChangeDetectionStrategy, Input, ViewChild, ElementRef, Inject, OnDestroy, OnChanges, forwardRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

// This widget is a little weird - in that we need to control the existence of the Input
// element very tightly.  it may seem over-engineered, but this is the easiest way to ensure
// that stuff doesnt brick, clears correctly, and doesnt spam stuff

@Component({
	selector: 'file-uploader',
	templateUrl: './file-uploader.component.html',
	styleUrls: ['./file-uploader.component.scss'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => FileUploaderComponent),
			multi: true,
		}
	]
})
export class FileUploaderComponent implements OnInit, OnDestroy, OnChanges, ControlValueAccessor {

	private _multiple: boolean;
	private _files: File[] | FileList;

	@Input() accept: string[];
	@Input() capture: 'user' | 'environment';
	@Input() files: File[] | FileList;
	@Input() set multiple (multiple: boolean) { this._multiple = coerceBooleanProperty(multiple); }
	@Input() disabled = false;
	@Input() upload = true;

	input: HTMLInputElement;

	onChange = (value: File[] | FileList) => {};
	onTouched = () => {};

	get value() {
		return this._files;
	}

	constructor(
		@Inject(DOCUMENT) private _doc: Document,
	) { }

	ngOnChanges() {
		if (this.input) {
			this._checkInput();
		}
	}

	ngOnInit(): void {
		this._createInput();
		this._checkInput();
		this._placeInput();

		console.log('input should be available at this point');
	}

	ngOnDestroy() {
		this._destroyInput();
	}

	writeValue(files: File[] | FileList): void {
		this._files = files;
	}

	registerOnChange(fn: (value: File[] | FileList) => void): void {
		this.onChange = fn;
	}
	registerOnTouched(fn: () => void): void {
		this.onTouched = fn;
	}

	setDisabledState(disable: boolean): void {
		this.disabled = !!disable;
	}

	browseClick() {
		this.input.click();
	}

	private _createInput(): void {
		const input = this.input = this._doc.createElement('input');
		input.type = 'file';
		input.addEventListener('change', evt => {
			console.log('changed', evt);
		});
		// var parent = document.getElementById("parentDiv");
		// parent.appendChild(input);
		// input.style.cssText = `display: none;`;
	}

	private _checkInput(): void {
		const input = this.input,
			accept = this.accept.join(', ') || '',
			capture = input.getAttribute('multiple') || null;
		if (input.accept !== accept) {
			input.accept = accept;
		}
		if (input.multiple !== this._multiple) {
			input.multiple = !!this._multiple;
		}
		if (capture !== (this.capture || '')) {
			if (this.capture) {
				input.setAttribute('capture', this.capture);
			} else {
				input.removeAttribute('capture');
			}
		}
	}

	private _placeInput(): void {
		if (!this.input.parentElement) {
			this._doc.body.appendChild(this.input);
		}
	}

	private _destroyInput(): void {
		const input = this.input;
		if (input?.parentElement) {
			input.parentElement.removeChild(input);
		}
		this.input = null;
	}
}
