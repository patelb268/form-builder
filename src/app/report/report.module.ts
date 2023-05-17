import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EditReportComponent } from "./edit-report/edit-report.component";
import { ReportRoutingModule } from "./report-routing.module";
import { SharedModule } from "../shared/shared.module";
import { WhereComponent } from './edit-report/where/where.component';
import { SortingGroupingComponent } from './edit-report/sorting-grouping/sorting-grouping.component';
import { ExportOptionsComponent } from './edit-report/export-options/export-options.component';
import { RowFormattingComponent } from './edit-report/row-formatting/row-formatting.component';
import { MAT_RADIO_DEFAULT_OPTIONS } from "@angular/material/radio";

@NgModule({
	declarations: [EditReportComponent, WhereComponent, SortingGroupingComponent, ExportOptionsComponent, RowFormattingComponent],
	imports: [CommonModule, SharedModule,  ReportRoutingModule],
	providers: [{
		provide: MAT_RADIO_DEFAULT_OPTIONS,
		useValue: { color: 'primary' },
	}]
})
export class ReportModule {}
