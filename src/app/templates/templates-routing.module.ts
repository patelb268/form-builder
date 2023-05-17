import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SummaryComponent } from './summary/summary.component';
import { DetailComponent } from './detail/detail.component';

const routes: Routes = [
	{ path: ':slice', component: SummaryComponent },
	{ path: ':slice/edit/:id', component: DetailComponent },
    { path: ':slice/new', component: DetailComponent }
	// @@todo => edit/:slice/:form -> editor version
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class TemplatesRoutingModule {}
