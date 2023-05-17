import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';

import { AdminRoutingModule } from './admin-routing.module';
import { AuthEditorComponent } from './components/Auth/auth-editor/auth-editor.component';
import { ChangePasswordComponent } from './components/Auth/change-password/change-password.component';


@NgModule({
	declarations: [
		AuthEditorComponent,
		ChangePasswordComponent,
	],
	imports: [
		SharedModule,
		AdminRoutingModule
	]
})
export class AdminModule { }
