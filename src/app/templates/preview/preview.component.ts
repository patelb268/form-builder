import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService } from '@services/api.service';
import { NotifyService } from '@services/notify.service';
import { SliceService } from '@services/slice.service';

@Component({
	selector: 'app-preview',
	templateUrl: './preview.component.html',
	styleUrls: ['./preview.component.scss']
})
export class PreviewComponent implements OnInit {
	selectedTemplate = null;

	editAppSlice: number;
	templates = [];
	htmlContent = '';
	constructor(
		public dialogRef: MatDialogRef<PreviewComponent>,
		private _slices: SliceService,
		@Inject(MAT_DIALOG_DATA) public dialogData: any,
		private api: ApiService,
		private notifyService: NotifyService
	) {}

	ngOnInit() {
		this.loadTemplates();
	}

	loadTemplates() {
		this._slices.getAllSliceDetailWithMeta().subscribe((y: any[]) => {
			if (y && y.length) {
				const data = y[1].rows;
				this.templates = data.filter(
					(y) =>
						y.category === 'template' &&
						y.parent === this.dialogData.parentSliceId
				);
			}
		});
	}
	openTemplate(t) {
    if(this.selectedTemplate === t){
      this.selectedTemplate = null;
      this.htmlContent = '';
      return
    }
		this.selectedTemplate = t;
		this.api
			.request({
				'$/slice/utils/template_preview': {
					template: t.id,
					slice: this.dialogData.parentSliceId,
					record: this.dialogData.recordId
				}
			})
			.subscribe((y: any) => {
				this.htmlContent = y.html;
			});
	}

	save() {
		this.api
			.request({
				'$/slice/utils/print_template': {
					slice: this.dialogData.parentSliceId,
					template: this.selectedTemplate.id,
					record: this.dialogData.recordId
				}
			})
			.subscribe((t) => {
				if (t) {
					this.notifyService.success(
						'A PDF has automatically been saved', 
					);
				}
			});
	}

  print(){
    window.print();
  }
}
