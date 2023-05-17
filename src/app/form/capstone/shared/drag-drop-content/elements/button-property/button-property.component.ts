import { Component, OnInit, ViewContainerRef, Input } from '@angular/core';
import * as color from 'color';

@Component({
  selector: 'app-button-property',
  templateUrl: './button-property.component.html',
  styleUrls: ['./button-property.component.scss']
})
export class ButtonPropertyComponent implements OnInit {
  @Input() component: any;

  constructor(public vcRef: ViewContainerRef) {}

  ngOnInit() {}

  setButtonStyle(style: string) {
    const c = color(this.component.element.button_color);

    switch (style) {
      case 'raised':
        this.component.element.box_shadow_color = c
          .darken(0.2)
          .hex()
          .toString();
        this.component.element.gradient_top_color = '';
        this.component.element.gradient_bottom_color = '';
        break;

      case 'gradient':
        this.component.element.box_shadow_color = '';
        this.component.element.gradient_top_color = c
          .lighten(0.2)
          .hex()
          .toString();
        this.component.element.gradient_bottom_color = c
          .darken(0.2)
          .hex()
          .toString();
        break;

      default:
        this.component.element.box_shadow_color = '';
        this.component.element.gradient_top_color = '';
        this.component.element.gradient_bottom_color = '';
        break;
    }
  }

  onColorPickerChange(color: any) {
    let buttonStyle = 'flat';
    if (this.component.element.box_shadow_color) {
      buttonStyle = 'raised';
    } else if (this.component.element.gradient_top_color) {
      buttonStyle = 'gradient';
    }

    this.setButtonStyle(buttonStyle);
  } 

  updateButtonText() {
  if (this.component.element.change_to_reset) {
    this.component.element.content = 'Reset';
  } 
}
}
