import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { EditReportComponent } from "./edit-report/edit-report.component";

const routes: Routes = [
	{ path: ":sliceid/:reportid", component: EditReportComponent },
	{
		path: ":sliceid",
		component: EditReportComponent,
		data: { mode: "create" },
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class ReportRoutingModule {}
