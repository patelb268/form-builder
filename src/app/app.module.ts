import { BrowserModule } from '@angular/platform-browser';
import { NgModule, DoBootstrap, ApplicationRef, ErrorHandler } from '@angular/core';
import { take, filter, catchError, tap } from 'rxjs/operators';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app/app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SharedModule } from './shared/shared.module';
import { ApiService } from 'src/app/shared/services/api.service';
import { AppService } from 'src/app/shared/services/app.service';
import { environment } from 'src/environments/environment';
import { DebugService } from 'src/app/shared/services/debug.service';
import { SpokeGuard } from './shared/guards/spoke.guard';
import { UserGuard } from './shared/guards/user.guard';
import { UserAdministratorGuard } from './shared/guards/user-administrator.guard';
import { TableAdministratorGuard } from './shared/guards/table-administrator.guard';
import { SystemAdministratorGuard } from './shared/guards/system-administrator.guard';
import { NotifyService } from '@services/notify.service';
import { SliceService } from '@services/slice.service';
import { NotificationService } from '@services/notification.service';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { HeaderComponent } from './app/header/header.component';
import { Location } from '@angular/common';
import { SidenavComponent } from './app/sidenav/sidenav.component';

import { RoutingService } from '@services/routing.service';
import { StorageService } from '@services/storage.service';
import { FidService } from '@services/fid.service';
import { UserService } from '@services/user.service';
import { UserAdminService } from './admin/services/user-admin.service';
import { LegacyActionsService } from '@services/legacy-actions.service';
import { UserAgentService } from '@services/user-agent.service';
import { ActionsService } from '@services/actions.service';
import { FormService } from '@services/form.service';
import { ControlService } from '@services/control.service';
import { TitleService } from '@services/title.service';
import { FetchService } from '@services/fetch.service';
import { RecordService } from '@services/record.service';
import { MatDialogModule } from '@angular/material/dialog';
import { GlobalErrorHandler } from '../app/interceptor/global-error-handler';
//import {FormBuilderComponent} from '../app/form/capstone/form-builder/form-builder.component';
//import {SharedModuleForm} from '../app/form/capstone/shared/shared.module';
import {FormBuilderModule} from '../app/form/capstone/form-builder/form-builder.module';
// force our auth shim in
environment.api.hitchWithAuthenticate = [
	{ id: 'settings', request: { '!/report/settings/get': {} } },
	// {id: 'perms', request: {'!/slice/permissions_lite': {}}},
	{
		id: 'all',
		request: {
			settings: { $_: 'settings:rows', $_else: [] }
			// perms: {$_: 'perms:rows', $_else: []},
		}
	}
];

declare global {
	interface Window {
		appDebug: DebugService;
	}
}

@NgModule({
	declarations: [AppComponent, HeaderComponent, SidenavComponent],
	imports: [
		BrowserModule,
		SharedModule,
		AppRoutingModule,
		BrowserAnimationsModule,
		FormBuilderModule,
	],
	providers: [
		
		ApiService,
		AppService,
		DebugService,
		FidService,
		NotificationService,
		NotifyService,
		RoutingService,
		SliceService,
		StorageService,
		UserService,
		LegacyActionsService,
		UserAgentService,
		ActionsService,
		FormService,
		ControlService,
		TitleService,
		FetchService,
		RecordService,

		// Administrative Services
		UserAdminService,

		// Guards
		SystemAdministratorGuard,
		TableAdministratorGuard,
		UserAdministratorGuard,
		UserGuard,
		SpokeGuard // ensure you include {spoke: string} in route.data
	],

})
export class AppModule implements DoBootstrap {
	constructor(
		private _app: AppService,
		debug: DebugService,
		private _loc: Location
	) {
		if (!window.appDebug) {
			window.appDebug = debug;
		}
	}

	private _removeParamFromUrl(keys: string[]) {
		const params = new URLSearchParams(location.search),
			loc = this._loc,
			path = loc.path().split('?', 1)[0];
		let newString: string;
		keys.forEach((k) => params.delete(k));
		newString = '?' + params.toString();
		loc.replaceState(path, newString.length > 1 ? newString : '');
	}

	ngDoBootstrap(app: ApplicationRef) {
		const api = environment.api,
			params = new URLSearchParams(location.search),
			keysToRemove: string[] = [];

		// we want case insensitive on hideui
		params.forEach((v, k) => {
			const key = k.toLowerCase();
			switch (key) {
				case 'hideui':
					this._app.hideUi.next(coerceBooleanProperty(v));
					break;
				case 'lang':
				case 'language':
					console.log('adjust the language if we can...', v);
					this._app.changeLanguage(v);
					keysToRemove.push(k);
					break;
			}
		});
		// strip anything that was queued up
		this._removeParamFromUrl(keysToRemove);
		if (api && api.autoAuthenticate) {
			this._app.auth
				.pipe(
					catchError((err) => {
						throw 'shade';
					}),
					filter((a) => !!a),
					take(1)
				)
				.subscribe(() => this._startup(app));
		} else {
			this._startup(app);
		}
	}

	private _startup(ref: ApplicationRef) {
		ref.bootstrap(AppComponent);
	}
}
