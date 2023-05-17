import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { SliceService } from '@services/slice.service';
import { map, takeWhile, tap } from 'rxjs/operators';
import { Fid } from '../../models/fid';
import { MatMenu } from '@angular/material/menu';
import { sortObjectArrayByProperty } from '../../utils/sortObjectArrayByProperty';

@Component({
	selector: 'app-fields-dropdown',
	templateUrl: './fields-dropdown.component.html',
	styleUrls: ['./fields-dropdown.component.scss'],
})
export class FieldsDropdownComponent implements OnInit, OnDestroy {

	static injectToTextarea(str: string, ta: HTMLTextAreaElement) {
		ta.setRangeText(str, ta.selectionStart, ta.selectionEnd, 'select');
	}

	private _destroyed = false;

	@Input() path: string[] = [];
	@Input() set slice(slice: number) {
		if (this._slice !== slice) {
			this._slice = slice;
			this._cd.detectChanges();
		}
	}
	get slice() { return this._slice; }

	@Input() inMenu = false;
	@Input() label: string;
	@Input() parentMenu: MatMenu;
	@Input() tabindex: number;

	@Output() selected = new EventEmitter<string[]>();
	@Output() change = new EventEmitter<string>();

	@Input() textarea!: HTMLTextAreaElement;

	@Input() filter!: (fids: Fid[]) => Fid[];

	private _slice: number;

	constructor(
		private _slices: SliceService,
		private _cd: ChangeDetectorRef,
	) { }

	ngOnDestroy() {
		this._destroyed = true;
	}

	ngOnInit(): void {
		const ta = this.textarea;
		if (ta) {
			this.selected
				.pipe(
					takeWhile(() => !this._destroyed)
				)
				.subscribe(path => {
					FieldsDropdownComponent.injectToTextarea(`{${path.join(':')}}`, ta);
					this.change.emit(this.textarea.value || '');
				})
		}
	}

	addField(fid: Fid, path: string[] = []) {
		this.selected.emit([ ...path, fid.col]);
	}


	getFields(slice: number) {
		return this._slices
			.fids(slice)
			.pipe(
				map(fids => {
					if (this.filter) {
						return this.filter(fids);
					}
					return fids;
				}),
				map(fids => ({
					fields: fids.sort(sortObjectArrayByProperty('col')),
					related: fids.filter(r => !!r.relation).sort(sortObjectArrayByProperty('col')),
				})),

			);
	}



}
