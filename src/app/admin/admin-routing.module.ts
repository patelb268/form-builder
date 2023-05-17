import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthEditorComponent } from './components/Auth/auth-editor/auth-editor.component';
import { UserAdministratorGuard } from '../shared/guards/user-administrator.guard';

const routes: Routes = [
	// {path: 'debug', component: DebugComponent}
	{path: 'auth/:id', component: AuthEditorComponent, canActivate: [UserAdministratorGuard]},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class AdminRoutingModule { }
