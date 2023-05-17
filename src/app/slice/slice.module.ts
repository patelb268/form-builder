import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';

import { SliceRoutingModule } from './slice-routing.module';
import { SliceEditorComponent } from './components/slice-editor/slice-editor.component';
import { SliceHomeComponent } from './components/slice-home/slice-home.component';


@NgModule({
	declarations: [
		SliceEditorComponent,
		SliceHomeComponent
	],
	imports: [
		SharedModule,
		SliceRoutingModule,
	]
})
export class SliceModule { }
