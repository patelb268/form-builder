import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class LegacyActionsService {

	constructor(
		private _router: Router,
	) {
		if (this.isInIframe) {
			addEventListener('message', (msg) => {
				try {
					const params = JSON.parse(msg.data),
						routeTo: string = params?.routeTo;
					if (routeTo) {
						this._router.navigateByUrl(routeTo);
					}
				} catch (err) {
					console.warn('failure', {err, msg});
				}
			});
		}
	}

	get isInIframe() {
		return window !== parent;
	}

	dashboards() {
		return this._notifyParent(`dashboards=0`);
	}

	rolesAndPermissions() {
		return this._notifyParent(`editPermissions=0`);
	}

	editRole(id: number) {
		return this._notifyParent(`editRole=${id}`);
	}

	editPermissions(id: number) {
		return this._notifyParent(`editPermissions=${id}`);
	}

	clients() {
		return this._notifyParent(`clients=0`);
	}

	users() {
		return this._notifyParent(`users=0`);
	}

	notifications() {
		return this._notifyParent(`emails=0`);
	}

	environment(settingId: number) {
		return this._notifyParent(`views=${settingId}`);
	}

	private _notifyParent(hash: string) {

		const message = JSON.stringify({hash}),
			origin = '*';

		if (this.isInIframe) {
			parent.postMessage(message, origin);
			console.log('parent.postMessage', {message, origin});
		} else {

			const chunks = location.hostname.split('.'),
				spoke = chunks.shift(),
				domain = chunks[chunks.length - 1],
				proto = location.protocol,
				url = `${proto}//${spoke}.${domain === 'datalynk' ? 'datalynk' : chunks.join('.')}/#${hash}`;

			location.href = url;
		}
	}
}
