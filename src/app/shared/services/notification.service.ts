import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { map, tap } from 'rxjs/operators';
import { NotificationRow, NotificationAttachmentRow } from '../models/slices/notification';
import { of } from 'rxjs';
import { UploadRow } from '../models/slices/uploads';

export interface NotificationData {
	row: NotificationRow;
	attachments?: NotificationAttachmentRow[];
	files?: UploadRow[];
}

@Injectable({
	providedIn: 'root'
})
export class NotificationService {

	private static _CACHE = new Map<number, NotificationRow>();

	constructor(
		private _api: ApiService,
	) {
	}

	fetch(id: number) {
		const c = this._cached(id);
		if (c) {
			return of(c);
		} else {
			return this._fetchAndCache(id);
		}

	}

	private _fetch(id: number) {
		// alright, this needs to do a bit more now
		return this._api.request<NotificationData>({'$/tools/do': [
			'report', {'!/env/notifications/report': {
				fields: {
					'*': '*',
					_to: ['$coalesce',   ['$if', ['$field', 'toRef'], ['$field', 'recipient:display'], null], ['$field', 'to']],
					_from: ['$coalesce', ['$if', ['$field', 'fromRef'], ['$field', 'sender:display'], null],  ['$field', 'from']],
					_creatorRef: ['$if', ['$field', 'creatorRef'], ['$field', 'creator:display'], null],
					_modifierRef: ['$if', ['$field', 'modifierRef'], ['$field', 'modifier:display'], null],
				},
				where: {id},
			}},
			'attachments', {'!/env/notification_attachments/report': {
				where: {notificationRef: id},
			}},
			'uploadIds', {'!/tools/column': {col: 'uploadRef', rows: {$_: 'attachments:rows'}}},
			'files', {'!/tools/file/namesByIds': {ids: {$_: 'uploadIds'}}},
			'respond', {
				row: {$_: 'report:rows:0'},
				attachments: {$_: 'attachments:rows'},
				files: {$_: 'files:rows'},
			},
		]}, {labelAs: `notification.fetch.${id}`})
		.pipe(
			map(r => {
				const ret: NotificationRow = r.row,
					files = r.files;
				ret.attachments = (r.attachments || []).map(row => {
					const match = files.find(f => f.id === row.uploadRef);
					if (match) {
						row.display_name = match.display_name;
						row.extension = match.extension;
					}
					return row;
				});
				return ret;
			})
		);
	}

	private _fetchAndCache(id: number) {
		return this._fetch(id)
			.pipe(
				tap(r => this._cache(r))
			);
	}

	private _cached(id: number) {
		return NotificationService._CACHE.get(id);
	}

	private _cache(row: NotificationRow) {
// this._api.upload()
		NotificationService._CACHE.set(row.id, row);
	}

}
