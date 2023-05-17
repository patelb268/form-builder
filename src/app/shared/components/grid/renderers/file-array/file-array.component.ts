import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ApiService } from '../../../../services/api.service';

@Component({
	selector: 'app-grid-renderer-file-array',
	templateUrl: './file-array.component.html',
	styleUrls: ['./file-array.component.scss'],
	
})
export class FileArrayComponent implements OnInit, ICellRendererAngularComp {

	ids: any;
	token: any;

	constructor(		private _api: ApiService,
		) { }

	ngOnInit() {
		this.token = this._api.getToken();
	}

	agInit(p: ICellRendererParams) {
		this.ids = p.value ? JSON.parse(p.value) : [];
	}

	refresh() { return false; }

	download(id: number) {
		console.log('download', id);
	}

}
