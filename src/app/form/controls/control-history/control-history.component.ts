import { Component, ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';
import { ControlBase } from '../control-base';
import { DlHistoryControl, DlTextareaControl } from '../../models/control';
import { ICellEditorParams, ICellRendererParams, RowNode } from 'ag-grid-community';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';

export interface ControlTextareaComponentParams extends ICellEditorParams {
	hi?: string;
}

@Component({
	selector: 'app-control-history',
	templateUrl: './control-history.component.html',
	styleUrls: ['./control-history.component.scss'],
})
export class ControlHistoryComponent extends ControlBase<DlHistoryControl> {

	@ViewChild('resizeSourceNode', {read: ElementRef, static: false}) resizeSourceNode: ElementRef<HTMLElement>;
	@ViewChild('taNode', {read: ElementRef, static: false}) taNode: ElementRef<HTMLTextAreaElement>;
	@ViewChild('autosize', {read: CdkTextareaAutosize, static: false}) autosize: CdkTextareaAutosize;

	private _row: RowNode;
	private _initalHeight: number;

	inGrid: boolean;

	// ag-grid
	// since ROW edit is being called, this is called for the entire row..
	// this SHOULDNT be called.. not sure wtf going on, but we need it for now
	focusIn() {
		console.log('focusIn');
		super.focusIn();
		this._sizeChanged();
	}

	keyDown(evt: KeyboardEvent) {
		if (evt.code === 'Enter') {
			evt.stopPropagation();
		}
	}

	private _resetHeight() {
		this._row?.setRowHeight(this._initalHeight);
	}

	private _sizeChanged() {
		if (this._row) {
			const el = this.resizeSourceNode?.nativeElement as HTMLElement,
				height = el?.scrollHeight + 1 + 6,
				min = this._initalHeight,
				row = this._row,
				setHeight = height < min ? min : height;


			if (setHeight && this._row.rowHeight !== setHeight) {
				row.setRowHeight(setHeight); // this is a temp fix..
			}
		}
	}

	

}
