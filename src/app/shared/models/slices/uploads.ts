import { StandardRow } from './base';

export interface UploadRow extends StandardRow {
	checksum?: string;
	mask?: string;
	file_name?: string;
	extension?: string;
	location?: string;
	display_name?: string;
	auth?: number;
	deleted?: Date;
	app?: string;
}
