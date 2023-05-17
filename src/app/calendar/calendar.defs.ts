export interface LegacyCalendarMeta {
	allDay?: 1 | 0;
	colorBackfill?: 1 | 0;
	dateInterval?: 'month';
	endTimeAttr?: string; // field
	firstDayOfWeek?: number;
	onEmptyRowClick?: 'none'; // add?
	onRowClick: 'edit' | 'none' | 'view';
	onRowClickNewTab?: any;
	showLabelTime?: 1 | 0;
	startTimeAttr?: string; // field
	summaryAttr?: string; // excel expression syntax
}

export enum CALENDAR_VIEW {
	MONTH = 'month',
}

export enum CALENDAR_DATE_FN {
	TODAY = 'today',
	YESTERDAY = 'yesterday',
	TOMORROW = 'tomorrow',
	LAST_MONTH = 'lastmonth',
	NEXT_MONTH = 'nextmonth',
	START_OF_YEAR = 'startofyear',
	END_OF_YEAR = 'endofyear',
}

export const CALENDAR_ENTRY = {
	[CALENDAR_DATE_FN.TODAY]: () => new Date(),
	[CALENDAR_DATE_FN.YESTERDAY]: () => {
		const d = new Date();
		d.setDate(d.getDate() - 1);
		return d;
	},
	[CALENDAR_DATE_FN.TOMORROW]: () => {
		const d = new Date();
		d.setDate(d.getDate() + 1);
		return d;
	},
	[CALENDAR_DATE_FN.LAST_MONTH]: () => {
		const d = new Date();
		d.setDate(0);
		return d;
	},
	[CALENDAR_DATE_FN.NEXT_MONTH]: () => {
		const d = new Date();
		d.setMonth(d.getMonth() + 1, 1);
		return d;
	},
	[CALENDAR_DATE_FN.START_OF_YEAR]: () => {
		const d = new Date();
		d.setMonth(0, 1);
		return d;
	},
	[CALENDAR_DATE_FN.END_OF_YEAR]: () => {
		const d = new Date();
		d.setFullYear(d.getFullYear() + 1, 0, 0);
		return d;
	},
}

export interface CalendarMeta {

	entryView?: CALENDAR_VIEW;
	entryDate?: keyof CALENDAR_DATE_FN | (() => Date) | Date;

}
