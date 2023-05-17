import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-custom-error-dialog',
  templateUrl: './custom-error-dialog.component.html',
  styleUrls: ['./custom-error-dialog.component.scss']
})
export class CustomErrorDialogComponent implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public  _data: any,) { }

  ngOnInit(): void {
  }

}
