import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-text-property',
  templateUrl: './text-property.component.html',
  styleUrls: ['./text-property.component.scss']
})
export class TextPropertyComponent implements OnInit {
  @Input() component: any;

  constructor() {}

  ngOnInit() {}
}
