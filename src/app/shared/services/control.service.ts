import { Injectable } from '@angular/core';
import { Fid } from '../models/fid';
import { ControlNumberboxComponent } from 'src/app/form/controls/control-numberbox/control-numberbox.component';
import { ControlTextboxComponent } from 'src/app/form/controls/control-textbox/control-textbox.component';

@Injectable({
	providedIn: 'root'
})
export class ControlService {

	constructor() { }


	/**
	 * Note:
	 *
	 * this should likely get deprecated, as its KINDA dependant on the grid, and we can more easily
	 * create controls when/where we need them with standard angular/material stuff..
	 *
	 * i think
	 *
	 * don't quote me on this.
	 */
	componentFromFid(fid?: Fid) {
		if (fid) {
			// console.log('from fid', fid);
			if (fid.relation) {
				// console.log('related');
			}
			switch (fid.renderHint) {
				case 'number':
					if (!fid.triggerMagic) {
						return [ControlNumberboxComponent, {}];
					}
					break;
				case 'string':
					// console.log('string type', fid);
					return [ControlTextboxComponent, {}];
				default:
					console.warn('unknown', fid);
			}
		}
		return [];
	}
}
