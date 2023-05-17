import { Component, OnInit, ChangeDetectionStrategy, ElementRef } from '@angular/core';
import { timeStringToDate } from 'src/app/shared/modules/dl-date-time/timeStringToDate';
import { DlTextboxControl } from '../../models/control';
import { ControlBase } from '../control-base';

@Component({
  selector: 'app-control-date-time',
  templateUrl: './control-date-time.component.html',
  styleUrls: ['./control-date-time.component.scss']
})
export class ControlDateTimeComponent extends ControlBase<DlTextboxControl>
implements OnInit
{

  form = null;
constructor(elementRef: ElementRef) {
  super(elementRef);
}

ngOnInit(): void {
  super.ngOnInit();
}


}
