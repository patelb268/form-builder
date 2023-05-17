import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MonthCalendarComponent } from './components/month/month.calendar.component';
import { CalendarSliceComponent } from './components/slice/slice.calendar.component';


const routes: Routes = [
	{path: ':slice', component: CalendarSliceComponent},
	{path: ':slice/:year/:month', component: MonthCalendarComponent},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class CalendarRoutingModule { }
