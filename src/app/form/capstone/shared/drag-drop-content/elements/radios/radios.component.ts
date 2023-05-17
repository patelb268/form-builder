import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-radios',
  templateUrl: './radios.component.html',
  styleUrls: ['./radios.component.scss']
})
export class RadiosComponent implements OnInit {
  @Input() component: any;
  @Input() formDesign: any;

  constructor() {}

  ngOnInit() {}
}
