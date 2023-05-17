import { StandardRow } from './base';

export interface NotificationRow extends StandardRow {

	type?: 'email' | 'sms' | 'gcm' | 'fax' | 'phone';
	toRef?: number;
	to?: string;
	fromRef?: number;
	from?: string;
	subject?: string;
	body?: string;

	attempts?: number;
	status?: string;
	note?: string;
	auth?: number;

	_to?: string;
	_from?: string;

	attachments: NotificationAttachmentRow[];

}

export interface NotificationAttachmentRow {
	id: number;
	uploadRef: number;
	notificationRef: number;

	// mixed from uploads table
	display_name?: string;
	extension?: string;
}
