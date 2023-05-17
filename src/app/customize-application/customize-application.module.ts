import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DetailComponent } from './detail/detail.component';
import { CustomizeApplicationRoutingModule } from './customize-application-routing.module';
import { SharedModule } from '../shared/shared.module';


@NgModule({
	declarations: [ DetailComponent],
	imports: [CommonModule,SharedModule ,CustomizeApplicationRoutingModule]
})
export class CustomizeApplicationModule {}
