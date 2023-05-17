import { NgModule } from '@angular/core';
import { DlDateTime } from './dl-date-time.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
	declarations: [
		DlDateTime,
	],
	imports: [
		CommonModule,
		ReactiveFormsModule,
		MatIconModule,
		MatMenuModule,
		MatDatepickerModule,
		MatButtonModule,
		MatDividerModule,
		MatTooltipModule,
	],
	exports: [
		DlDateTime,
	]
})
export class DlDateTimeModule { }
