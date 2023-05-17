import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RoutedFormComponent } from './routed-form/routed-form.component';

const routes: Routes = [
	{path: ':slice', component: RoutedFormComponent},
	{path: ':slice/:form', component: RoutedFormComponent},
	{path: ':slice/:form/add', redirectTo: ':slice/:form/0/add'},
	{path: ':slice/:form/:record', component: RoutedFormComponent},
	{path: ':slice/:form/:record/:mode', component: RoutedFormComponent},

	// @@todo => edit/:slice/:form -> editor version
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FormRoutingModule { }
