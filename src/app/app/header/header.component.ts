import {
	Component,
	OnInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	AfterViewInit
} from '@angular/core';
import { AppService } from '@services/app.service';
import { Auth } from 'auxilium-connect';
import { environment } from 'src/environments/environment';

@Component({
	selector: 'app-header',
	templateUrl: './header.component.html',
	styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, AfterViewInit {
	auth: Auth;
	version = environment.version;
	constructor(public app: AppService, private _cd: ChangeDetectorRef) {}

	ngOnInit() {
		this.app.auth.subscribe((a) => {
			this.auth = a;
			this._cd.detectChanges();
		});
	}

	ngAfterViewInit(): void {
		if (!this.app.leftNavOpen.getValue()) {
			this.app.toggleLeftSidenav();
			this._cd.detectChanges();
		}
	}

	c(ops) {
		let sum = 0,
			op_arr = [];
		for (let i = 0; i < ops.length; i++) {
			switch (ops[i]) {
				case '+':
					sum +=
						op_arr[
							op_arr.push(
								op_arr[op_arr.length - 1] +
									op_arr[op_arr.length - 2]
							) - 1
						];
					break;
				case 'C':
					sum -= op_arr.pop();
					break;
				case 'D':
					sum +=
						op_arr[op_arr.push(op_arr[op_arr.length - 1] * 2) - 1];
					break;
				default:
					sum += op_arr[op_arr.push(parseInt(ops[i])) - 1];
			}
		}
		return sum;
	}
	logout(all?: boolean) {
		this.app.logout(all).subscribe();
	}
}
