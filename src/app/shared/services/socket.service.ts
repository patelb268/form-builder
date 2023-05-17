import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged, shareReplay, tap, startWith } from 'rxjs/operators';
import { AuxiliumSocketClient } from '@auxilium/socket-client';
import { environment } from '../../../environments/environment'

@Injectable({
	providedIn: 'root'
})
export class SocketService extends AuxiliumSocketClient {

	private _authorized = new Subject<string | null>();

	// returns when we are authorized on this spoke, or NULL if not authorized
	authorized: Observable<string | null> = this._authorized
		.pipe(
			distinctUntilChanged(),
			tap(s => console.log('spoke:authorized => ', s)),
			shareReplay(1),
		);

	constructor(
		private _api: ApiService,
	) {
		super(environment.socket);

		// listen to changes in the auth...
		_api.auth
			.subscribe(() => _api.socket.resume(_api.getToken(), _api.spoke as string));

		// disconnected/unauth - flush
		this._api.socket
			.on('unauthorized', () => this._authorized.next(null));

		// when we join a spoke, inform whatever needs to know
		this._api.socket
			.on('spoke-authorized', ev => this._authorized.next(ev.spoke));

			this._api.token.pipe(startWith(this._api.getToken())).subscribe((t) => {
				this.resume(t, this._api?.spoke as string);
			});

	}

}
