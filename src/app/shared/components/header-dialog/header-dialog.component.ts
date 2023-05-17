import { Component, ElementRef, Inject, OnInit } from '@angular/core'
import { MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'


@Component({
  selector: 'app-header-dialog',
  templateUrl: './header-dialog.component.html',
  styleUrls: ['./header-dialog.component.scss']
})
export class HeaderDialogComponent implements OnInit {
  public positionRelativeToElement: ElementRef
  name: any;
  constructor(
      public dialogRef: MatDialogRef<HeaderDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public options: { positionRelativeToElement: ElementRef,name: any }
      ) {
        this.positionRelativeToElement = options.positionRelativeToElement
  }

  ngOnInit() {
this.name = this.options.name;
  const matDialogConfig = new MatDialogConfig()
  // let cla = this.options.positionRelativeToElement as any;
  // let ele = document.getElementsByClassName(cla).item(0) as HTMLElement;

  const rect: DOMRect = this.positionRelativeToElement.nativeElement.getBoundingClientRect();

  matDialogConfig.position = { right: `10px`, top: `${rect.bottom + 12}px`,left: `${rect.left }px` }
  this.dialogRef.updatePosition(matDialogConfig.position)
  
  }
  close(e): void {
    console.log(e);
    this.dialogRef.close({data: this.name,isTabPressed: false});
  }
  tabPressed(e){
    console.log(e);
    this.dialogRef.close({data: this.name,isTabPressed: true});

  }
}
