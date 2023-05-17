import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { SLICE_CATEGORY } from 'src/app/shared/models/slice';

@Component({
	selector: 'app-slice-home',
	templateUrl: './slice-home.component.html',
	styleUrls: ['./slice-home.component.scss'],
	
})
export class SliceHomeComponent implements OnInit {

	CATEGORIES = SLICE_CATEGORY;

	constructor() { }

	ngOnInit(): void {
	}

}
