import { Component, OnInit, Input, ViewContainerRef, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-current-element',
  templateUrl: './current-element.component.html',
  styleUrls: ['./current-element.component.scss']
})
export class CurrentElementComponent implements OnInit {
  @Input() selectedComponent: any;
  @Input() formDesign: any;

  @Output() onPinSettingChange: EventEmitter<any> = new EventEmitter();

  constructor(public vcRef: ViewContainerRef) {}

  ngOnInit() {}

  updatePin(data:any){
    this.onPinSettingChange.emit(data);
  }
}
