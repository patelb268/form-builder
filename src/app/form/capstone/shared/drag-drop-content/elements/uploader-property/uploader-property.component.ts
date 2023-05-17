import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-uploader-property',
  templateUrl: './uploader-property.component.html',
  styleUrls: ['./uploader-property.component.scss'],
})
export class UploaderPropertyComponent implements OnInit {
  @Input() component: any;
  
  constructor() {}

  ngOnInit(): void {}
}
