import { Component, OnInit, ChangeDetectionStrategy, ElementRef } from '@angular/core';
import { DlTextboxControl } from '../../models/control';
import { ControlBase } from '../control-base';

@Component({
  selector: 'app-control-time-only',
  templateUrl: './control-time-only.component.html',
  styleUrls: ['./control-time-only.component.scss']
})
export class ControlTimeOnlyComponent extends ControlBase<DlTextboxControl>
implements OnInit
{
constructor(elementRef: ElementRef) {
  super(elementRef);
}

ngOnInit(): void {
  super.ngOnInit();
}
}
