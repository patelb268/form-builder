import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { DebugService } from '@services/debug.service';

@Component({
  selector: 'app-debug',
  templateUrl: './debug.component.html',
  styleUrls: ['./debug.component.scss'],
})
export class DebugComponent implements OnInit {

	debug: Observable<any>;

	constructor(
		private _debug: DebugService,
	) { }

	ngOnInit() {
		this.debug = this._debug.all();
	}

}
