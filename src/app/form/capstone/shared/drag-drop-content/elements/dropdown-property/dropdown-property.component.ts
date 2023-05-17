import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { UUID } from 'angular2-uuid';
import * as _ from 'lodash';
@Component({
	selector: 'app-dropdown-property',
	templateUrl: './dropdown-property.component.html',
	styleUrls: ['./dropdown-property.component.scss']
})
export class DropdownPropertyComponent implements OnInit {
    [x: string]: any;
	private _attributes: any;
	public varcharAttributes: Array<any> = [];
	public dropdownPinColor: any = {
		FormLabelPin : true,
		ShowLabelPin : true,
		ReportLabelPin : true,
		DefaultTypePin: true,
		DefaultValuePin: true,
		SubLabelPin: true,
		RequiredPin: true,
		ValidationPin: true,
		OptionPin:true
	  };

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

	mapOptionValueToId : object = {};

	@Output() onBindVariableChange: EventEmitter<any> = new EventEmitter();
	@Output() onPinSettingChange: EventEmitter<any> = new EventEmitter();

	constructor() {}

	ngOnInit() {
		this.component.pinData.forEach((element) => {
			if(element == "label name"){
			  this.dropdownPinColor.FormLabelPin = !this.dropdownPinColor.FormLabelPin;
			} else if (element == "show label") {
			  this.dropdownPinColor.ShowLabelPin = !this.dropdownPinColor.ShowLabelPin;
			}else if(element == "Default Type"){
			  this.dropdownPinColor.DefaultTypePin = !this.dropdownPinColor.DefaultTypePin;
			}else if(element == "Default Value"){
			  this.dropdownPinColor.DefaultValuePin =
				!this.dropdownPinColor.DefaultValuePin;
			}else if(element == "sub_label"){
			  this.dropdownPinColor.SubLabelPin = !this.dropdownPinColor.SubLabelPin;
			}else if(element == "show_required"){
			  this.dropdownPinColor.RequiredPin = !this.dropdownPinColor.RequiredPin;
			  this.dropdownPinColor.DefaultValuePin = !this.dropdownPinColor.DefaultValuePin;
			}else if(element == "Validation"){
			  this.dropdownPinColor.ValidationPin = !this.dropdownPinColor.ValidationPin;
			}else if(element == "dropdown_option"){
			  this.dropdownPinColor.OptionPin = !this.dropdownPinColor.OptionPin;
			}
		  });
		  this.component.optionsTextarea = "";
		  this.component.element.options.forEach((option) => {
			  
			  this.component.optionsTextarea += option.text + ', '+ option.value + '\n';
			  this.mapOptionValueToId[option.value] = option.id;
			  if (option.is_selected) {
				  this.component.selectedOptionId = option.id;
			  }
		  });
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

	addOption() {
		this.component.element.options.push({
			id: UUID.UUID(),
			text: 'Option' + ' ' + (this.component.element.options.length + 1),
			value: 'Value' + ' ' + (this.component.element.options.length + 1),
			is_selected: false
		});
	}

	removeOption(optionId: any) {
		this.component.element.options = this.component.element.options.filter(
			(v: any) => {
				return v.id != optionId;
			}
		);
	}

	onAttributeChange($event: any) {
		let attrTypes = ["varchar"];
		this.varcharAttributes = _.sortBy(
		  this.attributes.filter((att: any) => {
			return attrTypes.indexOf(att.type) > -1;
		  }),
		  ["name"]
		);
		this.handleOnBindVariableChange("");
	  }

	handleOnBindVariableChange($event: any) {
		this.onBindVariableChange.emit({
			value: $event,
			id: this.component.id
		});
	}

	onDefaultValueTypeChange() {
		if(this.component.element.default_value_type !== "previous"){
		  this.component.element.default_value = "";
		}
	  }
	  
	pinSetting(event, type){
    
		switch (type) {
		  case 'label name':
			this.dropdownPinColor.FormLabelPin = !this.dropdownPinColor.FormLabelPin;
			break;
		  
		  case 'show label':
			this.dropdownPinColor.ShowLabelPin = !this.dropdownPinColor.ShowLabelPin;
			break;
	
		  case 'report_label':
			this.dropdownPinColor.ReportLabelPin = !this.dropdownPinColor.ReportLabelPin;
			break;
		  
			case 'Default Type':
			  this.dropdownPinColor.DefaultTypePin = !this.dropdownPinColor.DefaultTypePin;
			  break;
			  
			case 'Default Value':
			  this.dropdownPinColor.DefaultValuePin = !this.dropdownPinColor.DefaultValuePin;
			  break;
		  
			case 'sub_label':
			  this.dropdownPinColor.SubLabelPin = !this.dropdownPinColor.SubLabelPin;
			  break;
			case 'show_required':
			  this.dropdownPinColor.RequiredPin = !this.dropdownPinColor.RequiredPin;
			  break;
			
			  
			case 'Validation':
			  this.dropdownPinColor.ValidationPin = !this.dropdownPinColor.ValidationPin;
			  break;

			case 'dropdown_option':
			  this.dropdownPinColor.OptionPin = !this.dropdownPinColor.OptionPin;
			  break;
		  default:
			break;
		}
		
		
			if(event.checked){
		  // matIcons.classList.add("enabledIcon");
		  // matIcons.classList.remove("disabledIcon");
				this.onPinSettingChange.emit({ 
					value:'add',
					pinType: type,
					component:this.component
				 });
			}
			else{
		  // matIcons.classList.add("disabledIcon");
		  // matIcons.classList.remove("enabledIcon");
				this.component.pinData = this.component.pinData.filter( ele => ele!==type);
				this.onPinSettingChange.emit({ 
					value:'remove',
					pinType: type,
					component:this.component
				 });
			}
		}

		updateOptionList(){
			let optinsTextareaArray = this.component.optionsTextarea.split('\n');
		let optionArray = [];
		optinsTextareaArray.forEach((option) => {
			if (option.trim().length > 0) {
				optionArray.push({
					id: this.mapOptionValueToId[option.trim()] || UUID.UUID(),
					text: option.split(',')[0].trim(),
					value: option.split(',')[1].trim(),
					is_selected: (this.component.selectedOptionId === this.mapOptionValueToId[option.trim()])
				})
			}
		});
		this.component.element.options = optionArray;
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
