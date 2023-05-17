import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as _ from 'lodash';

@Component({
	selector: 'app-textarea-property',
	templateUrl: './textarea-property.component.html',
	styleUrls: ['./textarea-property.component.scss']
})
export class TextareaPropertyComponent implements OnInit {
	private _attributes: any;
	public textareaPinColor: any = {
		FormLabelPin: true,
		ShowLabelPin: true,
		ReportLabelPin: true,
		DefaultTypePin: true,
		DefaultValuePin: true,
		SubLabelPin: true,
		RequiredPin: true,
		ValidationPin: true
	};

	textColor = new FormControl("#000000");
	@Input() component: any;
	@Input() set attributes(value: any) {
		this._attributes = value;

		if (this._attributes) {
			this.varcharAttributes = _.sortBy(
				this._attributes.filter((att: any) => {
					return att.type === 'varchar';
				}),
				['name']
			);
		}
	}

	get attributes(): any {
		return this._attributes;
	}

	@Output() onBindVariableChange: EventEmitter<any> = new EventEmitter();
	@Output() onPinSettingChange: EventEmitter<any> = new EventEmitter();
	public varcharAttributes: Array<any> = [];

	constructor() {}

	ngOnInit() {
		this.component.pinData.forEach((element) => {
			if (element == 'label name') {
				this.textareaPinColor.FormLabelPin =
					!this.textareaPinColor.FormLabelPin;
			} else if (element == 'show label') {
				this.textareaPinColor.ShowLabelPin =
					!this.textareaPinColor.ShowLabelPin;
			} else if (element == 'Default Type') {
				this.textareaPinColor.DefaultTypePin =
					!this.textareaPinColor.DefaultTypePin;
			} else if (element == 'Default Value') {
				this.textareaPinColor.DefaultValuePin =
					!this.textareaPinColor.DefaultValuePin;
			} else if (element == 'sub_label') {
				this.textareaPinColor.SubLabelPin =
					!this.textareaPinColor.SubLabelPin;
			} else if (element == 'show_required') {
				this.textareaPinColor.RequiredPin =
					!this.textareaPinColor.RequiredPin;
				this.textareaPinColor.DefaultValuePin =
					!this.textareaPinColor.DefaultValuePin;
			} else if (element == 'Validation') {
				this.textareaPinColor.ValidationPin =
					!this.textareaPinColor.ValidationPin;
			}
		});
	}

	handleOnBindVariableChange($event: any) {
		this.onBindVariableChange.emit({
			value: $event,
			id: this.component.id
		});
	}

	onDefaultValueTypeChange() {
		if (this.component.element.default_value_type !== 'previous') {
			this.component.element.default_value = '';
		}
	}

	pinSetting(event, type) {
		switch (type) {
			case 'label name':
				this.textareaPinColor.FormLabelPin =
					!this.textareaPinColor.FormLabelPin;
				break;

			case 'show label':
				this.textareaPinColor.ShowLabelPin =
					!this.textareaPinColor.ShowLabelPin;
				break;

			case 'report_label':
				this.textareaPinColor.ReportLabelPin =
					!this.textareaPinColor.ReportLabelPin;
				break;

			case 'Default Type':
				this.textareaPinColor.DefaultTypePin =
					!this.textareaPinColor.DefaultTypePin;
				break;

			case 'Default Value':
				this.textareaPinColor.DefaultValuePin =
					!this.textareaPinColor.DefaultValuePin;
				break;

			case 'sub_label':
				this.textareaPinColor.SubLabelPin =
					!this.textareaPinColor.SubLabelPin;
				break;
			case 'show_required':
				this.textareaPinColor.RequiredPin =
					!this.textareaPinColor.RequiredPin;
				break;

			case 'Validation':
				this.textareaPinColor.ValidationPin =
					!this.textareaPinColor.ValidationPin;
				break;
			default:
				break;
		}

		if (event.checked) {
			// matIcons.classList.add("enabledIcon");
			// matIcons.classList.remove("disabledIcon");
			this.onPinSettingChange.emit({
				value: 'add',
				pinType: type,
				component: this.component
			});
		} else {
			// matIcons.classList.add("disabledIcon");
			// matIcons.classList.remove("enabledIcon");
			this.component.pinData = this.component.pinData.filter(
				(ele) => ele !== type
			);
			this.onPinSettingChange.emit({
				value: 'remove',
				pinType: type,
				component: this.component
			});
		}
	}
}
