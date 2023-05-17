import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SliceService } from '@services/slice.service';
import { map, switchMap } from 'rxjs/operators';

@Component({
	selector: 'app-slice',
	templateUrl: './slice.calendar.component.html',
	styleUrls: ['./slice.calendar.component.scss'],
})
export class CalendarSliceComponent implements OnInit {

	constructor(
		private _route: ActivatedRoute,
		private _slices: SliceService,
		private _router: Router,
		// private _history: History
	) { }

	ngOnInit(): void {

		this._route
			.paramMap
			.pipe(
				map(p => +p.get('slice')),
				switchMap(id => this._slices.fetch(id)),
			)
			.subscribe(slice => {
				const meta = slice?.meta?.calendar,
					now = new Date();
				if (!meta) {
					// no, we want to replace the history
					this._router.navigate(['/calendar', slice.id, now.getFullYear(), now.getMonth()], {
						skipLocationChange: true,
					});
				}
			})
	}

}
