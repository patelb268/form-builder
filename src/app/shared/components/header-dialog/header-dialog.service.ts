import { ElementRef, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HeaderDialogComponent } from './header-dialog.component';

/**
 * Service to create modal dialog windows.
 */
@Injectable({
	providedIn: 'root'
})

export class HeaderDialogService {
	constructor(public dialog: MatDialog) {}
  name: any;
  public openDialog({ positionRelativeToElement,
    hasBackdrop = true,name, height = '65px', width = '250px' }:
    {
      positionRelativeToElement: ElementRef, hasBackdrop?: boolean,name: any,
      height?: string, width?: string
    }): MatDialogRef<HeaderDialogComponent> {
      this.name = name;

    const dialogRef: MatDialogRef<HeaderDialogComponent> =
      this.dialog.open(HeaderDialogComponent, {
        hasBackdrop: hasBackdrop,
        height: height,
        width: width,
        data: { positionRelativeToElement: positionRelativeToElement,name: name }
      })
    return dialogRef
  }
}
