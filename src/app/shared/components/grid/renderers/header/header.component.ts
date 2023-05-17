import { Component, ElementRef, ViewChild } from '@angular/core';
import { IHeaderAngularComp } from 'ag-grid-angular';
import { IHeaderParams } from 'ag-grid-community';

@Component({
	selector: 'app-custom-header',
	templateUrl: './header.component.html',
	styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements IHeaderAngularComp {
	refresh(params: IHeaderParams): boolean {
		return true;
	}
	public params: IHeaderParams;

	public ascSort: string;
	public descSort: string;
	public noSort: string;

	@ViewChild('menuButton', { read: ElementRef }) public menuButton;

	agInit(params: IHeaderParams): void {
		this.params = params;

		params.column.addEventListener(
			'sortChanged',
			this.onSortChanged.bind(this)
		);

		this.onSortChanged();
	}

	onMenuClicked($event: Event) {
		$event.preventDefault();
		this.params.showColumnMenu(this.menuButton.nativeElement);
	}

	onSortChanged() {
		this.ascSort = this.descSort = this.noSort = 'inactive';
		if (this.params.column.isSortAscending()) {
			this.ascSort = 'active';
		} else if (this.params.column.isSortDescending()) {
			this.descSort = 'active';
		} else {
			this.noSort = 'active';
		}
	}

	sort($event) {
		this.ascSort = this.descSort = this.noSort = 'inactive';
		if (this.params.column.isSortAscending()) {
			this.descSort = 'active';
			this.onSortRequested('desc', $event);
		} else if (this.params.column.isSortDescending()) {
			this.noSort = 'active';
			this.onSortRequested('', $event);
		} else {
			this.ascSort = 'active';
			this.onSortRequested('asc', $event);
		}
	}

	onSortRequested(order: any, event: any) {
		this.params.setSort(order, event.shiftKey);
	}
}
