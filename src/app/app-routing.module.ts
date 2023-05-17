import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DebugComponent } from './shared/components/debug/debug.component';
import { HomeComponent } from './shared/settings/home/home.component';
import { ProfileComponent } from './shared/settings/profile/profile.component';
import { AgGridComponent } from './shared/components/grid/ag-grid.component';
import { SystemAdministratorGuard } from './shared/guards/system-administrator.guard';
import { FindAndReplaceComponent } from './shared/components/find-and-replace/find-and-replace.component';
import { FindAndReplaceAngularComponent } from './shared/components/find-and-replace-angular/find-and-replace-angular.component';
import { FormBuilderComponent } from './form/capstone/form-builder/form-builder.component';

const routes: Routes = [

	{path: 'admin', loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)},

	{path: 'debug', component: DebugComponent},
	{path: 'form-builder', component: FormBuilderComponent},

	{path: 'calendar', loadChildren: () => import('./calendar/calendar.module').then(m => m.CalendarModule)},

	{path: 'form', loadChildren: () => import('./form/form.module').then(m => m.FormModule)},
	{path: 'templates', loadChildren: () => import('./templates/templates.module').then(m => m.TemplatesModule)},
	{path: 'import', loadChildren: () => import('./import/import.module').then(m => m.ImportModule)},

	// {path: 'grid', loadChildren: () => import('./grid/grid.module').then(m => m.GridModule)},
	{path: 'grid', children: [
		// whitelist a
		{path: 'keyval', redirectTo: '/settings/keyval'},
		{path: 'settings', redirectTo: '/settings/keyval'},
		{path: 'users', redirectTo: '/settings/users'},
		{path: ':id', component: AgGridComponent, data: {routed: true}},
	]},

	{path: 'import', loadChildren: () => import('./import/import.module').then(m => m.ImportModule)},

	{path: 'settings', children: [
		{path: '', component: HomeComponent},
		{path: 'account', redirectTo: 'profile'},
		{path: 'profile', component: ProfileComponent},
		{path: 'keyval', component: AgGridComponent, data: {routed: true, slice: 'settings'}, canActivate: [SystemAdministratorGuard]},
		{path: 'users', component: AgGridComponent, data: {routed: true, slice: 'auth'}}
	]},

	// tools/find/
	{path: 'tools', children: [
		{path: 'find/:slice/:field', component: FindAndReplaceComponent},
		{path: 'findNew/:slice/:field', component: FindAndReplaceAngularComponent},
	]},

	// these 2 should be pointing to the same modu
	{path: 'create', loadChildren: () => import('./slice/slice.module').then(m => m.SliceModule)},
	{path: 'edit', loadChildren: () => import('./slice/slice.module').then(m => m.SliceModule)},
	{path: 'editReport', loadChildren: () => import('./report/report.module').then(m => m.ReportModule)},
	{path: 'createReport', loadChildren: () => import('./report/report.module').then(m => m.ReportModule)},
	{path: 'editApplication', loadChildren: () => import('./customize-application/customize-application.module').then(m => m.CustomizeApplicationModule)},
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule { }
