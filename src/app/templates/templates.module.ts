import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SummaryComponent } from './summary/summary.component';
import { DetailComponent } from './detail/detail.component';
import { TemplatesRoutingModule } from './templates-routing.module';
import { SharedModule } from '../shared/shared.module';
import { FormulaFieldSelectorComponent } from './formula-field-selector/formula-field-selector.component';
import { PreviewComponent } from './preview/preview.component';

@NgModule({
	declarations: [SummaryComponent, DetailComponent, FormulaFieldSelectorComponent, PreviewComponent],
	imports: [CommonModule,SharedModule ,TemplatesRoutingModule]
})
export class TemplatesModule {}
