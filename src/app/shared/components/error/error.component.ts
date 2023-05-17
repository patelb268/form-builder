import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { AppService } from '@services/app.service';

@Component({
	selector: 'app-error',
	templateUrl: './error.component.html',
	styleUrls: ['./error.component.scss'],
})
export class ErrorComponent implements OnInit {

	@Input() error: string;
	@Input() data: object;

	constructor(
		public app: AppService
	) { }

	ngOnInit(): void {
	}

	get showLoginDialog() {
		return this.error === 'error_guest_permission_denied';
	}

}
