import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { MatDialog } from '@angular/material/dialog';
import { ViewNotificationComponent } from 'src/app/shared/components/view-notification/view-notification.component';

export interface NotificationLinkParams {
	id?: string;
	subject?: string;
}

interface NotificationLinkComponentParams
	extends NotificationLinkParams,
		ICellRendererParams {}

@Component({
	selector: 'app-grid-renderer-notification-link',
	templateUrl: './notification-link.component.html',
	styleUrls: ['./notification-link.component.scss'],
	
})
export class NotificationLinkComponent
	implements OnInit, ICellRendererAngularComp, NotificationLinkParams
{
	// body: Expression = 'body';
	subject = 'subject';
	id = 'id';

	constructor(private _dialog: MatDialog) {}

	ngOnInit() {}

	agInit(p: NotificationLinkComponentParams) {
		if (p && p.data) {
			const subject = p.subject || this.subject,
				id = p.id || this.id;
			this.subject = p.data[subject];
			this.id = p.data[id];
		}
	}

	openEmail() {
		this._dialog.open(ViewNotificationComponent, {
			data: this.id,
			panelClass: 'no-decorate'
		});
	}

	refresh() {
		return false;
	}
}
