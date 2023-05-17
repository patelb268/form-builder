import {
	Component,
	Input,
	Output,
	OnInit,
	EventEmitter,
	SimpleChanges
} from '@angular/core';
import { UUID } from 'angular2-uuid';
import * as _ from 'lodash';

@Component({
	selector: 'app-radios-property',
	templateUrl: './radios-property.component.html',
	styleUrls: ['./radios-property.component.scss']
})
export class RadiosPropertyComponent implements OnInit {
	private _attributes: any;
	public varcharAttributes: Array<any> = [];
	public radioPinColor: any = {
		FormLabelPin: true,
		ShowLabelPin: true,
		DefaultTypePin: true,
    	DefaultValuePin: true,
		RequiredPin: true,
		SelectedOptionPin: true,
		RadioOptionPin: true,
		LabelAlignPin: true,
	};

	@Input() component: any;
	@Input() formDesign: any;
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

	isLabelChecked: boolean = false;
	constructor() {}

	// @Input() optionsTextarea : string = '';
	mapOptionValueToId: object = {};
	// @Input() selectedOptionId : string;
	selectedSpecialOption: string = 'none';

	ngOnInit() {
		this.isLabelChecked = this.component.pinData.includes('label');

		this.component.pinData.forEach((element) => {
			if (element == 'label name') {
				this.radioPinColor.FormLabelPin =
					!this.radioPinColor.FormLabelPin;
			} else if (element == 'show label') {
				this.radioPinColor.ShowLabelPin =
					!this.radioPinColor.ShowLabelPin;
			} else if (element == 'Default Type') {
				this.radioPinColor.DefaultTypePin =
					!this.radioPinColor.DefaultTypePin;
			} else if (element == 'Default Value') {
				this.radioPinColor.DefaultValuePin =
					!this.radioPinColor.DefaultValuePin;
			} else if (element == 'show_required') {
				this.radioPinColor.RequiredPin =
					!this.radioPinColor.RequiredPin;
			} else if (element == 'selected_option') {
				this.radioPinColor.SelectedOptionPin =
					!this.radioPinColor.SelectedOptionPin;
			} else if (element == 'radio_option') {
				this.radioPinColor.RadioOptionPin =
					!this.radioPinColor.RadioOptionPin;
			} else if (element == 'label_align') {
				this.radioPinColor.LabelAlignPin =
					!this.radioPinColor.LabelAlignPin;
			}
			
		});
		this.component.optionsTextarea = '';
		this.component.element.options.forEach((option) => {
			this.component.optionsTextarea += option.text + ', '+ option.value + '\n';
			this.mapOptionValueToId[option.value] = option.id;
			if (option.is_selected) {
				this.component.selectedOptionId = option.id;
			}
		});
		console.log(this.component.element.options);
		console.log(this.component.optionsTextarea);
	}
	setAsDefault($event: any) {
		this.component.element.options.forEach((v: any, k: number) => {
			if (v.id == $event.target.value) {
				v.is_selected = true;
			} else {
				v.is_selected = false;
			}
		});
	}

	onDefaultValueTypeChange() {
		if (this.component.element.default_value_type !== 'previous') {
			this.component.element.default_value = '';
		}
	}

	updateOptionList() {
		let optinsTextareaArray = this.component.optionsTextarea.split('\n');
		let optionArray = [];
		optinsTextareaArray.forEach((option) => {
			if (option.trim().length > 0) {
				optionArray.push({
					id: this.mapOptionValueToId[option.trim()] || UUID.UUID(),
					text: option.split(',')[0].trim(),
					value: option.split(',')[1].trim(),
					is_selected:
						this.component.selectedOptionId ===
						this.mapOptionValueToId[option.trim()]
				});
			}
		});
		this.component.element.options = optionArray;
	}

	handleOnBindVariableChange($event: any) {
		this.onBindVariableChange.emit({
			value: $event,
			id: this.component.id
		});
	}

	pinSetting(event, type) {
		switch (type) {
			case 'label name':
				this.radioPinColor.FormLabelPin =
					!this.radioPinColor.FormLabelPin;
				break;
			case 'show label':
				this.radioPinColor.ShowLabelPin =
					!this.radioPinColor.ShowLabelPin;
				break;
			case 'show_required':
				this.radioPinColor.RequiredPin =
					!this.radioPinColor.RequiredPin;
				break;
			case 'Default Type':
				this.radioPinColor.DefaultTypePin =
					!this.radioPinColor.DefaultTypePin;
				break;

			case 'Default Value':
				this.radioPinColor.DefaultValuePin =
					!this.radioPinColor.DefaultValuePin;
				break;
			case 'selected_option':
				this.radioPinColor.SelectedOptionPin =
					!this.radioPinColor.SelectedOptionPin;
				break;
			case 'radio_option':
				this.radioPinColor.RadioOptionPin =
					!this.radioPinColor.RadioOptionPin;
				break;
			case 'label_align':
				this.radioPinColor.LabelAlignPin =
					!this.radioPinColor.LabelAlignPin;
				break;
			default:
				break;
		}
		if (event.checked) {
			this.onPinSettingChange.emit({
				value: 'add',
				pinType: type,
				component: this.component
			});
		} else {
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

	onAttributeChange($event: any) {
		let attrTypes = ['varchar'];
		this.varcharAttributes = _.sortBy(
			this.attributes.filter((att: any) => {
				return attrTypes.indexOf(att.type) > -1;
			}),
			['name']
		);
		this.handleOnBindVariableChange('');
	}

	changeSelectedOption(event) {
		let selectOptionId = event.value;
		this.component.element.options.map(
			(option) => (option.is_selected = option.id === selectOptionId)
		);
		//this.component.selectedOptionId = selectOptionId;
	}

	handleSpecialOptionsChange(event) {
		this.component.element.options = [];
		this.selectedSpecialOption = event.value;
		if (this.selectedSpecialOption === 'none') {
			this.component.element.options = [
				{
					id: UUID.UUID(),
					text: 'Value 1',
					value: '100',
					is_selected: true
				},
				{
					id: UUID.UUID(),
					text: 'Value 2',
					value: '101',
					is_selected: false
				},
				{
					id: UUID.UUID(),
					text: 'Value 3',
					value: '102',
					is_selected: false
				}
			];
		} else if (this.selectedSpecialOption === 'gender') {
			this.component.element.options = [
				{
					id: UUID.UUID(),
					text: 'Male',
					value: 'Male',
					is_selected: true
				},
				{
					id: UUID.UUID(),
					text: 'Female',
					value: 'Female',
					is_selected: false
				},
				{
					id: UUID.UUID(),
					text: 'N/A',
					value: 'N/A',
					is_selected: false
				}
			];
		} else if (this.selectedSpecialOption === 'days') {
			this.component.element.options = [
				{
					id: UUID.UUID(),
					text: 'Monday',
					value: 'Monday',
					is_selected: true
				},
				{
					id: UUID.UUID(),
					text: 'Tuesday',
					value: 'Tuesday',
					is_selected: false
				},
				{
					id: UUID.UUID(),
					text: 'Wednesday',
					value: 'Wednesday',
					is_selected: false
				},
				{
					id: UUID.UUID(),
					text: 'Thursday',
					value: 'Thursday',
					is_selected: false
				},
				{
					id: UUID.UUID(),
					text: 'Friday',
					value: 'Friday',
					is_selected: false
				},
				{
					id: UUID.UUID(),
					text: 'Saturday',
					value: 'Saturday',
					is_selected: false
				},
				{
					id: UUID.UUID(),
					text: 'Sunday',
					value: 'Sunday',
					is_selected: false
				}
			];
		} else if (this.selectedSpecialOption === 'months') {
			this.component.element.options = [
				{
					id: UUID.UUID(),
					text: 'January',
					value: 'January',
					is_selected: true
				},
				{
					id: UUID.UUID(),
					text: 'February',
					value: 'February',
					is_selected: false
				},
				{
					id: UUID.UUID(),
					text: 'March',
					value: 'March',
					is_selected: false
				},
				{
					id: UUID.UUID(),
					text: 'April',
					value: 'April',
					is_selected: false
				},
				{
					id: UUID.UUID(),
					text: 'May',
					value: 'May',
					is_selected: false
				},
				{
					id: UUID.UUID(),
					text: 'June',
					value: 'June',
					is_selected: false
				},
				{
					id: UUID.UUID(),
					text: 'July',
					value: 'July',
					is_selected: false
				},
				{
					id: UUID.UUID(),
					text: 'August',
					value: 'August',
					is_selected: false
				},
				{
					id: UUID.UUID(),
					text: 'September',
					value: 'September',
					is_selected: false
				},
				{
					id: UUID.UUID(),
					text: 'October',
					value: 'October',
					is_selected: false
				},
				{
					id: UUID.UUID(),
					text: 'November',
					value: 'November',
					is_selected: false
				},
				{
					id: UUID.UUID(),
					text: 'December',
					value: 'December',
					is_selected: false
				}
			];
		}
	}
}
