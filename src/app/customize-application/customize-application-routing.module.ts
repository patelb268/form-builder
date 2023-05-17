import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DetailComponent } from './detail/detail.component';

const routes: Routes = [
	{ path: ':id', component: DetailComponent },
	// @@todo => edit/:slice/:form -> editor version
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class CustomizeApplicationRoutingModule {}
