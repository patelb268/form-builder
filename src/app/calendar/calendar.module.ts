import { NgModule } from '@angular/core';

import { CalendarRoutingModule } from './calendar-routing.module';
import { SharedModule } from '../shared/shared.module';
import { MonthCalendarComponent } from './components/month/month.calendar.component';
import { CalendarSliceComponent } from './components/slice/slice.calendar.component';


@NgModule({
	declarations: [
		MonthCalendarComponent,
		CalendarSliceComponent
	],
	imports: [
		SharedModule,
		CalendarRoutingModule
	]
})
export class CalendarModule { }
