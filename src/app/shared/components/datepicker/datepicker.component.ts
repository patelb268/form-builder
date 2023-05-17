import { Component, OnInit } from '@angular/core';
import { ICellEditorComp, ICellEditorParams } from 'ag-grid-community';
import { formatDate } from '@angular/common';
import { timeStringToDate } from "../../modules/dl-date-time/timeStringToDate";
// import * as moment from 'moment';

@Component({
  selector: 'app-datepicker',
  templateUrl: './datepicker.component.html',
  styleUrls: ['./datepicker.component.scss']
})
export class DatepickerComponent implements OnInit, ICellEditorComp {
  params: any;
  f: any;
  mode = 'edit';
  Defparams: any;
  hideTime: boolean = false;
  selectedDate: any;
  timeInput: any;


  constructor() { }

  ngOnInit(): void {

  }
  getGui() {
    return this.selectedDate;
  }
  agInit(params: ICellEditorParams): void {
    this.params = params;
    this.timeInput = new Date(this.params.value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.selectedDate = this.params.value;

    if (this.params.values == null) {
      return;
    }

    this.f = this.params.values[0].fid;
    if (this.f.renderHint == 'date') {
      this.hideTime = true;
    } else {
      this.hideTime = false;
      console.log(this.params, 'params');
      if (this.Defparams != undefined) {
        this.timeInput = this.params?.value?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

    }
    this.Defparams = this.params.values[0].def;
    this.selectedDate = formatDate(this.params.value, this.Defparams.dateFormatEdit, 'en-US')
    console.log(this.params, 'params');

  }
  // returns the new value after editing
  getValue() {
    const formattedTime = timeStringToDate(this.timeInput) as any,
    event = new Date(formattedTime),
    time = event.toLocaleTimeString('en-US');
    // console.log(time,this.selectedDate);
    // var dateTime = new Date(moment(this.selectedDate + ' ' + time) as any);
    // console.log(dateTime);

    return new Date();
  }
  onDate(event): void {
    this.selectedDate = formatDate(event.value, this.Defparams.dateFormatEdit, 'en-US')

  }
  setDateTime() {
    this.timeInput = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  timeChange() {
    // console.log(this.timeInput);
    this.timeInput = timeStringToDate(this.timeInput);
    // console.log("timechange", this.selectedDate,this.timeInput);
    // this.timeInput = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

}
