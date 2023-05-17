import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Input, OnDestroy } from '@angular/core';
import { AppService } from '@services/app.service';
import { ActivatedRoute } from '@angular/router';
import { SliceService } from '@services/slice.service';
import { Slice } from 'src/app/shared/models/slice';
import { takeWhile } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { MatDatepicker } from '@angular/material/datepicker';

export type CalendarView = 'month';

@Component({
	selector: 'app-calendar',
	templateUrl: './month.calendar.component.html',
	styleUrls: ['./month.calendar.component.scss'],
})
export class MonthCalendarComponent implements OnInit, OnDestroy {

	// start column
	// end column
	// all day (currently a checkbox, should be capable of binding to a field)
	// display label
	// display time?
	// first day of week
	// default view -> month/week/day
	// row click
	// empty row click
	date = new FormControl(new Date());
	end: Date;
	monthRange: Date[] = [];
	@Input() slice: Slice;
	start: Date;
	today = new Date().setHours(0, 0, 0, 0);
	@Input() view: CalendarView = 'month';

	private _destroyed = false;

	constructor(
		public app: AppService,
		private _cd: ChangeDetectorRef,
		private _route: ActivatedRoute,
		private _slices: SliceService,
	) { }

	chosenYearHandler(date: Date) {
		const d = new Date(this.date.value);
		d.setFullYear(date.getFullYear());
		this.date.setValue(d);
	}
	chosenMonthHandler(date: Date, picker: MatDatepicker<Date>) {
		const d = new Date(this.date.value);
		d.setMonth(date.getMonth());
		this.date.setValue(d);
		picker.close();
	}

	ngOnDestroy() {
		this._destroyed = true;
	}

	ngOnInit() {

		this._route.paramMap
			.pipe(
				takeWhile(() => !this._destroyed),
			)
			.subscribe(p => {

				const today = new Date(),
					slice = +p.get('slice'),
					view = p.get('view') as CalendarView;

				if (view) {
					this.view = view;
				}

				if (slice) {
					this._fetchSlice(slice);
				} else if (this.slice) {
					this._loadSlice(this.slice);
				}

				const d: Date = new Date(this.date.value),
					day = d.getDate(),
					yearParam = p.get('year'),
					monthParam = p.get('month'),
					year = yearParam || yearParam === '0' ? +yearParam : d.getFullYear(),
					month = monthParam || monthParam === '0' ? +monthParam : d.getMonth();
				if ((year || year === 0) && year !== d.getFullYear()) {
					d.setFullYear(year, month);
					this.date.setValue(d);
				} else if ((month || month === 0)) {
					d.setMonth(month);
					this.date.setValue(d);
				}

				// if ((year || year === 0) && d.getFullYear() !== year) {
				// 	d.setFullYear(year, (month ))
				// }

			});


	}

	onMoveNext() {
		console.warn('@@todo');
	}
	onMovePrevious() {
		console.warn('@@todo');
	}
	onMoveToday() {
		console.warn('@@todo');
	}

	private _fetchSlice(sliceId: number) {
		this._slices
			.fetch(sliceId, {})
			.pipe(
				takeWhile(() => !this._destroyed),
			)
			.subscribe(slice => {
				this.slice = slice;
				this._loadSlice(slice);
			});
	}

	private _loadSlice(slice: Slice) {
		this._buildMonthArray();
		this._cd.detectChanges();
	}

	private _buildMonthArray() {

		const range = this.monthRange = [],
			date: Date = this.date.value,
			year = date.getFullYear(),
			month = date.getMonth(),
			first = new Date(year, month, 1),
			firstDay = first.getDay(),
			initialDay = new Date(year, month, 1 - firstDay),
			daysInMonth = new Date(year, month + 1, 0).getDate(),
			max = daysInMonth + firstDay > 35 ? 42 : 35,
			y = initialDay.getFullYear(),
			m = initialDay.getMonth(),
			d = initialDay.getDate();

		for (let i = 0; i < max; i++) {
			range.push(new Date(y, m, d + i));
		}

		console.log(this.monthRange);
	}
}
