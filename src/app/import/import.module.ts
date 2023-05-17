import { NgModule } from '@angular/core';

import { ImportRoutingModule } from './import-routing.module';
import { SharedModule } from '../shared/shared.module';
import { ImportService } from './services/import.service';
import { ImportTestComponent } from './components/import-test/import-test.component';


@NgModule({
	declarations: [

	ImportTestComponent],
	imports: [
		SharedModule,
		ImportRoutingModule
	],
	providers: [
		ImportService,
	]
})
export class ImportModule { }
