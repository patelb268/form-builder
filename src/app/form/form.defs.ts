import { Slice } from '../shared/models/slice';
import { DlForm } from './models/container';

export enum FORM_ERROR_CODES {
	LEGACY_NEEDS_RESAVE = 'error_form_legacy_missing_source',
	FORM_NOT_FOUND = 'error_form_not_found',
	SLICE_NOT_FOUND = 'error_slice_not_found',
	UKNNOWN = 'error_unknown',
}

export enum FORM_MODE {
	VIEW = 'view',
	EDIT = 'edit',
	ADD = 'add',
	SAVE ='save'
}

export interface FormParams {
	mode: FORM_MODE;
	record: number;
	slice: Slice;
	form: DlForm;
}
