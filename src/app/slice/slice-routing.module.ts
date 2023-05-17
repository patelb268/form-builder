import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SliceHomeComponent } from './components/slice-home/slice-home.component';
import { SliceEditorComponent } from './components/slice-editor/slice-editor.component';
import { SliceRow, SLICE_CATEGORY } from '../shared/models/slice';

// our base url is /create or /edit
const routes: Routes = [
	{path: '', component: SliceHomeComponent},

	{path: SLICE_CATEGORY.MAILING_LIST, component: SliceEditorComponent, data: ({category: SLICE_CATEGORY.MAILING_LIST, id: 0}) as SliceRow},

	{path: ':id', component: SliceEditorComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SliceRoutingModule { }
