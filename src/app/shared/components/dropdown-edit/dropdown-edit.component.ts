import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ApiService } from '@services/api.service';
import { ICellEditorComp, ICellEditorParams } from 'ag-grid-community';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dropdown-edit',
  templateUrl: './dropdown-edit.component.html',
  styleUrls: ['./dropdown-edit.component.scss']
})
export class DropdownEditComponent implements OnInit, ICellEditorComp {
  params: any;
  columnData = [];
  fid: any;
  columnName: any;
  selectedValue: any;
  enableNotInList: boolean = true;
  optionsData = [];
  private jsonData;

  constructor(private _api: ApiService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {

  }
  getGui() {
    return this.params;
  }
  getValue() {
    return this.selectedValue;
  }
  onChange(){
    // console.log(this.selectedValue);
  }

  public getJSON(): Observable<any> {
    return this.http.get(".."+this.fid.store?.fetch?.url);
}

  async agInit(params: ICellEditorParams) {
    this.params = params;
    this.selectedValue = params.value;
    this.fid = this.params.values[0].fid;
    console.log(this.fid)
    if(this.fid.store.enableNotInList == false){
      this.enableNotInList = false;
      if(this.fid.store?.fetch?.url){
        this.getJSON().subscribe(data => {
          console.log(data);
          this.columnData = data;
      });

      } else if(this.fid.store?.options) { 
        this.optionsData = this.fid.store.options;
        console.log(this.optionsData)

      }

    } else {
      this.getDropdownList();
    }
    this.columnName = this.fid.col;
  }
  getDropdownList() {
    this._api.request({
      "$/slice/report": {
        "slice": this.fid._slice.parent,
        "fields": [
          this.columnName
        ],
        "group": [
          [
            "$field",
            this.columnName
          ]
        ],
        "where": []
      },
    }).subscribe((r: any) => {
      this.columnData = r.rows;
    });
  }

}
