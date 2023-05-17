import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import * as _ from "lodash";
import { FormControl } from "@angular/forms";
@Component({
  selector: "app-input-property",
  templateUrl: "./input-property.component.html",
  styleUrls: ["./input-property.component.scss"],
})
export class InputPropertyComponent implements OnInit {
  private _attributes: any = [];
  public varcharAttributes: Array<any> = [];
  public inputTypes: Array<any> = [];
  public inputPinColor: any = {
    FormLabelPin : true,
    ShowLabelPin : true,
    ReportLabelPin : true,
    DefaultTypePin: true,
    DefaultValuePin: true,
    SubLabelPin: true,
    RequiredPin: true,
    ValidationPin: true,
  };



  color = new FormControl("#000000");

  @Input() component: any;
  @Input() formDesign: any;
  @Input() set attributes(value: any) {
    this._attributes = value;
    if (this._attributes) {
      let defaultType = this.component.type;
      let attrTypes = ["varchar"];

      if (this.component.element.bind_to_variable) {
        for (let item of this._attributes) {
          if (item.slug === this.component.element.bind_to_variable) {
            defaultType = item.type;
            break;
          }
        }
      }

      switch (defaultType) {
        case "date":
          attrTypes = ["date", "varchar"];
          break;

        case "datetime":
          attrTypes = ["datetime", "varchar"];
          break;

        case "number":
          attrTypes = ["integer", "varchar"];
          break;

        default:
          attrTypes = ["varchar"];
      }

      this.varcharAttributes = _.sortBy(
        this._attributes.filter((att: any) => {
          return attrTypes.indexOf(att.type) > -1;
        }),
        ["name"]
      );
    }
  }

  get attributes(): any {
    return this._attributes;
  }

  @Output() onBindVariableChange: EventEmitter<any> = new EventEmitter();
  @Output() onPinSettingChange: EventEmitter<any> = new EventEmitter();
  
  constructor() {}

  ngOnInit() {
    this.inputTypes = [
      {
        value: "text",
        label: "Text",
      },
      {
        value: "email",
        label: "Email",
      },
      {
        value: "password",
        label: "Password",
      },
      {
        value: "date",
        label: "Date",
      },
      {
        value: "datetime",
        label: "Date - Hour",
      },
      {
        value: "number",
        label: "Number",
      },
    ];

    // if(this.component.pinData.includes("label name")){
    //   this.inputPinColor.FormLabelPin = !this.inputPinColor.FormLabelPin;
    // }

    this.component.pinData.forEach((element) => {
      if(element == "label name"){
        this.inputPinColor.FormLabelPin = !this.inputPinColor.FormLabelPin;
      } else if (element == "show label") {
        this.inputPinColor.ShowLabelPin = !this.inputPinColor.ShowLabelPin;
      }else if(element == "Default Type"){
        this.inputPinColor.DefaultTypePin = !this.inputPinColor.DefaultTypePin;
      }else if(element == "Default Value"){
        this.inputPinColor.DefaultValuePin =
          !this.inputPinColor.DefaultValuePin;
      }else if(element == "sub_label"){
        this.inputPinColor.SubLabelPin = !this.inputPinColor.SubLabelPin;
      }else if(element == "show_required"){
        this.inputPinColor.RequiredPin = !this.inputPinColor.RequiredPin;
        this.inputPinColor.DefaultValuePin = !this.inputPinColor.DefaultValuePin;
      }else if(element == "Validation"){
        this.inputPinColor.ValidationPin = !this.inputPinColor.ValidationPin;
      }
    });

  }

  // defaultValueType: string = 'constant';
  // defaultValue: string = '';

  onDefaultValueTypeChange() {
    if(this.component.element.default_value_type !== "previous"){
      this.component.element.default_value = "";
    }
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
  onEditAttributeChange($event: any) {}
  onInputTypeChange($event: any) {
    let attrTypes = ['varchar'];

    switch ($event) {
      case 'date':
        attrTypes = ['date', 'varchar'];
        break;

      case 'datetime':
        attrTypes = ['datetime', 'varchar'];
        break;

      case 'number':
        attrTypes = ['integer', 'varchar'];
        break;

      default:
        attrTypes = ['varchar'];
    }

    this.varcharAttributes = _.sortBy(
      this.attributes.filter((att: any) => {
        return attrTypes.indexOf(att.type) > -1;
      }),
      ['name']
    );

    this.handleOnBindVariableChange('');
  }

  handleOnBindVariableChange($event: any) {
    this.onBindVariableChange.emit({
      value: $event,
      id: this.component.id
    });
  }

  pinSetting(event, type){
    
    switch (type) {
      case 'label name':
        this.inputPinColor.FormLabelPin = !this.inputPinColor.FormLabelPin;
        break;
      
      case 'show label':
        this.inputPinColor.ShowLabelPin = !this.inputPinColor.ShowLabelPin;
        break;

      case 'report_label':
        this.inputPinColor.ReportLabelPin = !this.inputPinColor.ReportLabelPin;
        break;
      
        case 'Default Type':
          this.inputPinColor.DefaultTypePin = !this.inputPinColor.DefaultTypePin;
          break;
          
        case 'Default Value':
          this.inputPinColor.DefaultValuePin = !this.inputPinColor.DefaultValuePin;
          break;
      
        case 'sub_label':
          this.inputPinColor.SubLabelPin = !this.inputPinColor.SubLabelPin;
          break;
        case 'show_required':
          this.inputPinColor.RequiredPin = !this.inputPinColor.RequiredPin;
          break;
        
          
        case 'Validation':
          this.inputPinColor.ValidationPin = !this.inputPinColor.ValidationPin;
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
  showPassword: boolean = false;

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
