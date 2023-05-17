import { Component, ElementRef, Inject, OnInit } from '@angular/core';
import {
	MatDialogConfig,
	MatDialogRef,
	MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { ApiService } from '@services/api.service';

@Component({
	selector: 'app-delete-dialog',
	templateUrl: './delete-dialog.component.html',
	styleUrls: ['./delete-dialog.component.scss']
})
export class DeleteDialogComponent implements OnInit {
	pswd: any;
    records: any;
	wrongPassword: boolean = false;
	constructor(
		public dialogRef: MatDialogRef<DeleteDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public options: { records: any },
		private _api: ApiService
	) {

	}

	ngOnInit() {
		this.records = this.options.records;
	}
	onNoClick(): void {
		this.dialogRef.close({ data: false });
	}
	onOkClick(){
		let data = {
			"$/report/checkPassword": {
				"password": this.pswd
			}
		}
		this._api.request(data).subscribe((re: any) => {
			if(re == true){
				this.wrongPassword = false;
				this.dialogRef.close({ data: re });
			} else if( re == false){
				this.wrongPassword = true;
			}
		});

	}
}
