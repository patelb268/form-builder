import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";

@Injectable({
	providedIn: "root",
})
export class RoutingService {
	dashboardView(dashboardId: number) {
		return `/dashboard/${dashboardId}`;
	}

	formAddRecord(sliceId: number, formId: number | string) {
		return `/form/${sliceId}/${formId}/add`;
	}

	formViewRecord(sliceId: number, formId: number | string, recordId: number) {
		return `/form/${sliceId}/${formId}/${recordId}/view`;
	}

	formEdit(sliceId: number, formId: number | string) {
		return `/form/edit/${sliceId}/${formId}`;
	}

	formEditRecord(sliceId: number, formId: number | string, recordId: number) {
		return `/form/${sliceId}/${formId}/${recordId}/edit`;
	}

	importData(sliceId: number) {
		return `/import/${sliceId}`;
	}

	manageTemplates(sliceId?: number) {
		if (sliceId) {
			return `/templates/${sliceId}`;
		} else {
			return `/templates`;
		}
	}

	home(){
		return environment.production? '/' : '';
	}

	templateCreate(inSlice: number) {
		return `/templates/${inSlice}/0`;
	}

	templateEdit(parentSlice: number, templateSlice: number) {
		return `/templates/${parentSlice}/${templateSlice}`;
	}

	editReportView(slice, reportId){
		return `/editReport/${slice}/${reportId}`;
	}

	reportView(sliceId: number, type?: string) {
		type = type || "grid";
		switch (type) {
			case "calendar":
				return this.calendarView(sliceId);
			case "grid":
			case "report":
				return this.gridView(sliceId);
			default:
				console.warn(
					`unable to find reportView.type = "${type}", falling back to "grid"`
				);
				return this.gridView(sliceId);
		}
	}

	calendarView(sliceId: number) {
		return `/calendar/${sliceId}`;
	}

	gridView(sliceId: number) {
		return `/grid/${sliceId}`;
	}

	schemaEdit(sliceId: number) {
		return `/schema/${sliceId}`;
	}

	CSVUpload(sliceId: number) {
		return `/import/${sliceId}`;
	}

	schemaCreate() {
		return `/schema/create`;
	}
}
