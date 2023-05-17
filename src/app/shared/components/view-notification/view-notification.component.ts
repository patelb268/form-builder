import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NotificationService } from '@services/notification.service';
import { Observable } from 'rxjs';
import { NotificationRow, NotificationAttachmentRow } from '../../models/slices/notification';
import { ApiService } from '@services/api.service';
import { HttpEventType } from '@angular/common/http';
import { AppService } from '@services/app.service';
import { tap } from 'rxjs/operators';
import { convertLegacyHtml } from '../../utils/convertLegacyHtml';

@Component({
	selector: 'app-view-notification',
	templateUrl: './view-notification.component.html',
	styleUrls: ['./view-notification.component.scss'],
	
})
export class ViewNotificationComponent implements OnInit {

	data: Observable<NotificationRow>;
	html: string;

	constructor(
		@Inject(MAT_DIALOG_DATA) public id: number,
		private _notifications: NotificationService,
		private _api: ApiService,
		public app: AppService,
	) { }

	ngOnInit() {
		this.data = this._notifications
			.fetch(this.id)
			.pipe(
				tap(resp => this.html = convertLegacyHtml(resp.body))
			);
	}

	downloadClick(evt: Event, attachment: NotificationAttachmentRow) {
		const filename = this.app.translate('file.ext', attachment);
		this._api
			.download(attachment.uploadRef)
			.subscribe(e => {
				if (e) {
					switch (e.type) {
						case HttpEventType.DownloadProgress:
							console.log('percent', e.loaded, e.total);
							break;
						case HttpEventType.Response:
							this.app.downloadFile(filename, e.body);
							break;
					}
				} else {
					this.app.notify.warn('error_file_not_found');
				}
			});
	}
}
