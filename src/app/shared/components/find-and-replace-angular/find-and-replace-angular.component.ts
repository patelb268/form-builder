import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { DatePipe } from '@angular/common';
import {
	Component,
	OnInit,
	ChangeDetectionStrategy,
	Input,
	Inject,
	OnDestroy,
	Output,
	EventEmitter,
	ChangeDetectorRef
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { AppService } from '../../services/app.service';
import {
	RecordReplaceParams,
	RecordService
} from '../../services/record.service';
import { SliceService } from '../../services/slice.service';
import { Optional } from 'ag-grid-community';
import { BehaviorSubject, combineLatest } from 'rxjs';
import {
	distinctUntilChanged,
	filter,
	map,
	pairwise,
	shareReplay,
	startWith,
	switchMap,
	take,
	takeWhile,
	tap
} from 'rxjs/operators';
import { Fid } from '../../models/fid';
import { Slice } from '../../models/slice';

/**
http://sandbox.datalynk:4200/tools/find/52063/date?hideui=true&where=%7B%7D&userparams=%7B%7D&slice=52068&selected=%5B%5D
 */

export interface FindAndReplaceParams {
	slice: number | Slice;
	column: number;
}

interface FormValue {
	find: string;
	findMatch: 'all' | 'exact' | 'partial';
	replace: string;
	replaceExpr?: string;
	replaceMatch: 'exact' | 'partial' | 'expression' | 'transform';
	replaceTransform?: 'uppercase' | 'lowercase' | 'capitalize';
	selected: number[];
	cloneBefore: boolean;
	cloneAfter: boolean;
	cloneReplaceOnly: boolean;
}

export interface FindAndReplaceResponse {
	selected: number[];
	changed: number[];
	newData: [];
}

@Component({
	selector: 'app-find-and-replace-angular',
	templateUrl: './find-and-replace-angular.component.html',
	styleUrls: ['./find-and-replace-angular.component.scss']
})
export class FindAndReplaceAngularComponent {
	url = null;
	onSave = new EventEmitter();
	constructor(
		@Inject(MAT_DIALOG_DATA) public data: any,
		public dialogRef: MatDialogRef<FindAndReplaceAngularComponent>
	) {
		this.url = data.url;
		window.addEventListener('message', (event) => {
			if (event && event.data) {
				const data = JSON.parse(event.data);
				if (data.findandreplaceclose) {
					dialogRef.close();
				}
				if(data.replacedvalues){
					this.onSave.emit(true)
				}
			}
		});
	}
}
