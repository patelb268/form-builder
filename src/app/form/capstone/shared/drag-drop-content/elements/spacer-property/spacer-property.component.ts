import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-spacer-property',
  templateUrl: './spacer-property.component.html',
  styleUrls: ['./spacer-property.component.scss']
})
export class SpacerPropertyComponent implements OnInit {
  @Input() component: any;

  constructor() {}

  ngOnInit() {}
}
