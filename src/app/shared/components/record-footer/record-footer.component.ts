import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
	selector: 'app-record-footer',
	templateUrl: './record-footer.component.html',
	styleUrls: ['./record-footer.component.scss'],
	
})
export class RecordFooterComponent<T> implements OnInit {

	@Input() data: T;
	@Input() idField = 'id';

	constructor() { }

	ngOnInit() {
		console.log('data', this.data);
	}

}
