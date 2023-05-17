import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
	selector: 'app-form-design-property',
	templateUrl: './form-design-property.component.html',
	styleUrls: ['./form-design-property.component.scss']
})
export class FormDesignPropertyComponent implements OnInit {
	@Input() formDesign: any;
  background_color;
  form_border_color;
  font_color;
  container_background_color;

	ngOnInit() {
    this.background_color  = new FormControl(this.formDesign.background_color);
    this.form_border_color  = new FormControl(this.formDesign.form_border_color);
    this.font_color  = new FormControl(this.formDesign.font_color);
    this.form_border_color  = new FormControl(this.formDesign.form_border_color);
    this.container_background_color  = new FormControl(this.formDesign.container_background_color);
  }
}
