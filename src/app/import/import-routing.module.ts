import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ImportTestComponent } from './components/import-test/import-test.component';

const routes: Routes = [
	{ path: ':slice', component: ImportTestComponent },

];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class ImportRoutingModule { }
