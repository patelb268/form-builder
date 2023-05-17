import { NgModule } from '@angular/core';

import { FormRoutingModule } from './form-routing.module';
import { SharedModule } from '../shared/shared.module';
import { RoutedFormComponent } from './routed-form/routed-form.component';
import { FormComponent } from './form/form.component';
import { ControlDropdownComponent } from './controls/control-dropdown/control-dropdown.component';
import { ControlTextboxComponent } from './controls/control-textbox/control-textbox.component';
import { ControlNumberboxComponent } from './controls/control-numberbox/control-numberbox.component';
import { ControlTextareaComponent } from './controls/control-textarea/control-textarea.component';
import { ControlHistoryComponent } from './controls/control-history/control-history.component';

import { ControlRelatedDropdownComponent } from './controls/control-related-dropdown/control-related-dropdown.component';
import { ControlCheckboxComponent } from './controls/control-checkbox/control-checkbox.component';
import { ControlFileComponent } from './controls/control-file/control-file.component';
import { ControlRadioComponent } from './controls/control-radio/control-radio.component';
import { ControlDateOnlyComponent } from './controls/control-date-only/control-date-only.component';
import { ControlTimeOnlyComponent } from './controls/control-time-only/control-time-only.component';
import { ControlDateTimeComponent } from './controls/control-date-time/control-date-time.component';
import { EmbedQueryGridComponent } from './embed-query-grid/embed-query-grid.component';
import { AgGridModule } from 'ag-grid-angular';


@NgModule({
	declarations: [
		RoutedFormComponent,
		FormComponent,
		ControlDropdownComponent,
		ControlTextboxComponent,
		ControlNumberboxComponent,
		ControlTextareaComponent,
		ControlHistoryComponent,
		ControlRelatedDropdownComponent,
		ControlCheckboxComponent,
		ControlFileComponent,
		ControlRadioComponent,
		ControlDateOnlyComponent,
		ControlTimeOnlyComponent,
		ControlDateTimeComponent,
  EmbedQueryGridComponent,
		
	],
	imports: [
		SharedModule,
		FormRoutingModule,
		AgGridModule.withComponents([EmbedQueryGridComponent])
	],
	exports: [
		FormComponent,
		ControlDropdownComponent,
		ControlTextboxComponent,
		ControlNumberboxComponent,
	]
})
export class FormModule { }
