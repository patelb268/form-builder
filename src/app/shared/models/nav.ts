import { SliceRow } from './slice';

export interface ApplicationSettingAction {
	action: string;
	params: any;
	label: string;
}
export interface ApplicationSettingChild {
	slice: number;
}

export interface ApplicationSetting {
	name: string;
	dashboard?: number;
	actions?: ApplicationSettingAction[]; // @@todo
	children?: ApplicationSettingChild[]; // @@todo
	id: number;
}

export interface ApplicationSettings {
	applications?: ApplicationSetting[];
	hideSlices?: number[];
}


export interface NavMeta {
	hidden: number;
	includeIn: number[];
	form: number;
	singular: string;
	plural: string;
	description?: string;
	type?: string;
	icon?: string;
}

export interface Dashboard {
	name: string;
	description: string;
	template: string;
	value: any;
	show: {
		header: boolean;
		toolbar: boolean;
		appMenu: boolean;
		exitButton: boolean;
	}
}

export interface Nav {
	config: ApplicationSettings;
	slices: SliceRow[];
	meta: {
		[sliceId: number]: NavMeta;
	};
	dashboards: {
		[dashId: number]: Dashboard;
	}
}
