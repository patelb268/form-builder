import { Component, OnInit, Input } from '@angular/core';
// import {FormBuilder} from '@angular/forms';

@Component({
  selector: 'app-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.scss']
})
export class CheckboxComponent implements OnInit {
  @Input() component: any;
  @Input() formDesign: any;

  constructor() {}

  ngOnInit() {}
}
