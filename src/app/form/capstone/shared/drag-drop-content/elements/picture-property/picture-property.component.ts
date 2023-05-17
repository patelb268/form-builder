import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { UUID } from 'angular2-uuid';
import * as _ from 'lodash';

@Component({
  selector: 'app-picture-property',
  templateUrl: './picture-property.component.html',
  styleUrls: ['./picture-property.component.scss']
})
export class PicturePropertyComponent implements OnInit {
  @Input() component: any;
  public ImagePinColor: any = {
		FormLabelPin : true,
    RequiredPin: true,
		ChooseFilePin : true,
		ReportLabelPin : true,
		ImageURLPin: true,
		ImageLinkin: true,
		HeightPin: true,
		WidthPin: true,
		AlignPin: true,
    HoverPin: true,
    CSSPin: true,
	  };

  constructor(
    
  ) {}
  errors: Array<any> = [];


  @Output() onPinSettingChange: EventEmitter<any> = new EventEmitter();
  mapOptionValueToId : object = {};

  ngOnInit() {
		this.component.pinData.forEach((element) => {
			if(element == "label name"){
			  this.ImagePinColor.FormLabelPin = !this.ImagePinColor.FormLabelPin;
			} else if(element == "show_required"){
			  this.ImagePinColor.RequiredPin = !this.ImagePinColor.RequiredPin;
			}else if(element == "report_label"){
        this.ImagePinColor.ReportLabelPin = !this.ImagePinColor.ReportLabelPin;
      }else if(element == "choose_file"){
        this.ImagePinColor.ChooseFilePin = !this.ImagePinColor.ChooseFilePin;
      }else if(element == "image_url"){
        this.ImagePinColor.ImageURLPin = !this.ImagePinColor.ImageURLPin;
      }else if(element == "image_link"){
        this.ImagePinColor.ImageLinkin = !this.ImagePinColor.ImageLinkin;
      }else if(element == "height"){
        this.ImagePinColor.HeightPin = !this.ImagePinColor.HeightPin;
      }else if(element == "width"){
        this.ImagePinColor.WidthPin = !this.ImagePinColor.WidthPin;
      }else if(element == "align"){
        this.ImagePinColor.AlignPin = !this.ImagePinColor.AlignPin;
      }else if(element == "hover"){
        this.ImagePinColor.HoverPin = !this.ImagePinColor.HoverPin;
      }else if(element == "css"){
        this.ImagePinColor.CSSPin = !this.ImagePinColor.CSSPin;
      }
		  });
		  
	}
  pinSetting(event, type){
    
		switch (type) {
		  case 'label name':
			this.ImagePinColor.FormLabelPin = !this.ImagePinColor.FormLabelPin;
			break;
		  
		 case 'report_label':
			this.ImagePinColor.ReportLabelPin = !this.ImagePinColor.ReportLabelPin;
			break;
		  
      case 'show_required':
			  this.ImagePinColor.RequiredPin = !this.ImagePinColor.RequiredPin;
			  break;
      
      case 'choose_file':
        this.ImagePinColor.ChooseFilePin = !this.ImagePinColor.ChooseFilePin;
        break;
      
      case 'image_url':
        this.ImagePinColor.ImageURLPin = !this.ImagePinColor.ImageURLPin;
        break;

      case 'image_link':
        this.ImagePinColor.ImageLinkin = !this.ImagePinColor.ImageLinkin;
        break;

      case 'height':
        this.ImagePinColor.HeightPin = !this.ImagePinColor.HeightPin;
        break;

      case 'width':
        this.ImagePinColor.WidthPin = !this.ImagePinColor.WidthPin;
        break;

      case 'align':
        this.ImagePinColor.AlignPin = !this.ImagePinColor.AlignPin;
        break;

      case 'hover':
        this.ImagePinColor.HoverPin = !this.ImagePinColor.HoverPin;
        break;
        
      case 'css':
        this.ImagePinColor.CSSPin = !this.ImagePinColor.CSSPin;
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

  public handleInputChange(e: any) {
    const file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    const pattern = /image-*/;
    const reader = new FileReader();

    if (!file.type.match(pattern)) {
      alert('Invalid format');
      return;
    }

    reader.onload = this._handleReaderLoaded.bind(this);
    reader.readAsDataURL(file);
  }

  _handleReaderLoaded(e: any) {
    this.component.element.image_url = e.target.result;    
  }

  
  selectFile(event: any) {
    console.log(event); 
		var reader = new FileReader();
		reader.readAsDataURL(event.target.files[0]);
		
		reader.onload = (_event) => {
			this.component.element.image_url = reader.result; 
		}
	}

  onURLChange(event: any) {
    console.log(event);
    this.component.element.image_url = event.target.value;
  }

  heightChange(event: any) {
    console.log(event.target.value);
    this.component.element.height = event.target.value;
  }
  widthChange(event: any) {
    console.log(event.target.value);
    this.component.element.width = event.target.value;
  }
}
