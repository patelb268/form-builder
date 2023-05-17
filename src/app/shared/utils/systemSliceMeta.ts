import {
	GridSerialized,
	EDITOR
} from 'src/app/shared/components/grid/ag-grid.lib';
import { environment } from 'src/environments/environment';
import { AuthRow } from 'auxilium-connect';
import { RoutedIconComponent } from 'src/app/shared/components/grid/renderers/routed-icon/routed-icon.component';
import { formatDate } from '@angular/common';
import { TranslatePipe } from '../pipes/translate.pipe';

export type MetaTypes = GridSerialized;
const formatDateInstance = formatDate;
const TranslatePipeInstance = TranslatePipe;

export const systemSliceMeta = new Map<string | number, MetaTypes>([
	// KEYVAL
	[
		'settings',
		{
			title: 'keyval',
			titleTranslate: true,
			// rowNumbers: true,
			// icon: 'icon_keyval',
			// iconTranslate: true,
			// iconColor: 'accent',
			columnOrder: ['public', 'key', 'val'],
			columns: {
				// id: {label: 'ID', width: 100, field: 'id'},
				key: {
					label: 'Key',
					flex: 1,
					field: 'key',
					sort: 'asc',
					sortedAt: 0
				},
				val: {
					label: 'Val',
					flex: 3,
					field: 'val',
					editor: EDITOR.TEXTAREA,
					editorParams: { hi: 'test' }
				},
				public: {
					label: 'Public?',
					width: 75,
					field: 'public',
					editor: EDITOR.CHECKBOX,
					editorParams: { hideLabel: true },
					renderer: EDITOR.CHECKBOX,
					rendererParams: { hideLabel: true },
					align: 'center'
				}
			},
			disable: {
				viewRecord: true,
				editRecord: true
			},
			onOpen: [
				{
					type: 'notify',
					method: 'warn',
					message:
						'Warning: These are system settings; any alterations may cause system instability!',
					config: {
						duration: 0
					}
				}
			]
		}
	],

	// this is our "settings/users" listing
	[
		'auth',
		{
			// icon: 'icon_users',
			// iconTranslate: true,
			columnOrder: [
				'_link',
				'id',
				'last_name',
				'first_name',
				'email',
				'login',
				'mobile_phone',
				'expire'
			],
			columns: {
				_link: {
					label: false,
					renderer: 'routedIcon',
					rendererParams: {
						icon: 'icon_edit',
						url: (row) => `/admin/auth/${row.id}`
					},
					width: RoutedIconComponent.width,
					pinned: 'left'
				},
				id: {
					field: 'id',
					label: 'id',
					width: 75
				},
				first_name: {
					label: 'first_name',
					width: 125,
					field: 'first_name'
				},
				last_name: {
					label: 'last_name',
					width: 125,
					field: 'last_name'
				},
				email: {
					label: 'email',
					width: 250,
					field: 'email'
				},
				mobile_phone: {
					label: 'mobile_phone',
					width: 100,
					field: 'mobile_phone'
				},
				login: {
					label: 'login',
					width: 125,
					field: 'login'
				},
				expire: {
					label: 'active?',
					width: 75,
					getValue: (row: AuthRow) => !row.expire,
					setValue: (value: boolean, row: AuthRow) => {
						row.expire = value ? null : new Date();
						return true;
					},
					editor: EDITOR.CHECKBOX,
					editorParams: {
						hideLabel: true
					},
					renderer: EDITOR.CHECKBOX,
					rendererParams: {
						hideLabel: true
					},
					field: 'expire'
				}
			},
			disable: {
				addRecord: true,
				viewRecord: true,
				editRecord: true,
				deleteRecord: true
				// columnReorder: true,
				// columnResize: true,
			},
			title: 'User Accounts',
			titleTranslate: true,
			labelTranslate: true
		}
	],

	[
		'notifications',
		{
			columnOrder: ['sent', 'subject','fromRef', 'toRef',  'type'],
			columns: {
				sent: {
					label: 'Sent',
					sort: 'desc',
					width: 300,
					sortedAt: 0,
					getValue: (row: any) => {
						if (row) {
							return formatDateInstance(
								row.sent,
								'MM/dd/YYYY hh:mm a',
								'en'
							);
						} else {
							return null;
						}
					}
				},
				subject: {
					label: 'Subject',
					renderer: 'notificationLink',
					width: 300
				},
				fromRef: {
					label: 'From',
					rendererParams: {
						noLink: true // tells the grid not to decorate the relationship
					},
					width: 250,
					valueFormatter: [
						'$coalesce',
						[
							'$if',
							['$field', 'fromRef'],
							['$field', 'sender:display'],
							['$field', 'from']
						],
						environment.systemEmail
					]
				},
				toRef: {
					label: 'To',
					rendererParams: {
						noLink: true
					},
					width: 250,
					valueFormatter: [
						'$if',
						['$field', 'toRef'],
						[
							'$coalesce',
							['$field', 'recipient:display'],
							['$field', 'recipient:email']
						],
						['$field', 'to']
					]
				},

				type: {
					label: 'Type',
					valueTranslate: true,
					width: 90
				},

				_attachments: {
					label: false,
					width: 24,
					renderer: 'iconValue',
					rendererParams: {
						disable: true
					},
					valueFormatter: [
						'$if',
						[
							'$count',
							[
								'$field',
								'ᗕ Notification Attachments by notification:id'
							]
						],
						'icon_attachment',
						''
					]
				}
			},
			disable: {
				addRecord: true,
				editRecord: true,
				viewRecord: true,
				deleteRecord: true
			},
			title: 'Notifications', // if this is not present, the title will be deduced from the slice.name
			titleTranslate: true, // this instructs the grid to "translate" the 'title (or slice.name)
			labelTranslate: true
		}
	],

	[
		'my_notifications',
		{
			columnOrder: ['type', 'fromRef', 'subject', 'sent', '_attachments'],
			columns: {
				fromRef: {
					label: 'From',
					width: 200,
					valueFormatter: [
						'$if',
						['$field', 'fromRef'],
						['$field', 'sender:display'],
						null
					]
				},
				subject: {
					label: 'Subject',
					width: 200,
					renderer: 'notificationLink'
				},
				type: {
					label: 'Type',
					valueTranslate: true,
					width: 75
				},
				sent: {
					label: 'Sent',
					width: 150,
					sort: 'desc',
					sortedAt: 0
				},
				_attachments: {
					label: false,
					width: 24,
					renderer: 'iconValue',
					rendererParams: {
						disable: true
					},
					valueFormatter: [
						'$if',
						[
							'$count',
							[
								'$field',
								'ᗕ Notification Attachments by notification:id'
							]
						],
						'icon_attachment',
						''
					]
				}
			},
			disable: {
				addRecord: true,
				editRecord: true,
				viewRecord: true,
				deleteRecord: true
			},
			titleTranslate: true,
			labelTranslate: true
		}
	]
]);
