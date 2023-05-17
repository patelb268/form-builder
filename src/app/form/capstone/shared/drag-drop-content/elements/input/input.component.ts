import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss']
})
export class InputComponent implements OnInit {
  @Input() component: any;
  @Input() formDesign: any;

  constructor() {}

  ngOnInit() {
    console.log(this.formDesign);
  }
}
