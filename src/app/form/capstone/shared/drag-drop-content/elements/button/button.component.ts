import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent implements OnInit {
  @Input() component: any;

  public buttonStyles: any;

  constructor() {}

  ngOnInit() {
    this.buttonStyles = {
      content: this.component.element.content,
      link_to: '',
      button_style: '',
      'background-color': this.component.element.button_color,
      color: this.component.element.text_color,
      'border-radius': this.component.element.rounded_corners + 'px',
      button_size: 'auto',
      font: this.component.element.font,
      'font-size': this.component.element.font_size + 'px',
      'font-weight': this.component.element.font_bold ? 'bold' : 'normal',
      'font-style': this.component.element.font_italic ? 'italic' : 'none',
      'line-height': this.component.element.line_height,
      height: this.component.element.height + 'px',
      'text-align': this.component.element.alignment
    };
  }
}
