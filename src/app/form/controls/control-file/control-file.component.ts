import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	EventEmitter,
	OnInit,
	Output,
} from "@angular/core";
import { Validators } from "@angular/forms";
import { ApiService } from "@services/api.service";
import { of } from "rxjs";
import { catchError, map, take } from "rxjs/operators";
import { DlFileControl } from "../../models/control";
import { ControlBase } from "../control-base";

@Component({
	selector: "app-control-file",
	templateUrl: "./control-file.component.html",
	styleUrls: ["./control-file.component.scss"],
})
export class ControlFileComponent
	extends ControlBase<DlFileControl>
	implements OnInit
{
	@Output("fileChange")
	fileChange = new EventEmitter();

	@Output("removeFile")
	removeFile = new EventEmitter();

	file = null;
	fileName = null;

	/**
	 *
	 */
	constructor(private el: ElementRef, private api: ApiService) {
		super(el);
	}

	ngOnInit() {
		super.ngOnInit();

		console.log("what are we going to set/get");
	}

	getFile(c) {
		const controlValue = c && c.value;
		if (controlValue && typeof controlValue === "string") {
			return this.api.getFileUrl(JSON.parse(controlValue)[0]);
		}
	}

	onFileChange(event: any) {
		this.file = event;
		this.fileChange.emit({ event: event, label: this.params.id });

		if (event.target.files && event.target.files[0]) {
			var filesAmount = event.target.files.length;
			for (const fileItem of event.target.files) {
				const file: File = fileItem;
				this.fileName = file.name;
			}
		}

		this.control.setErrors(null);
	}

	removeFiles() {
		if (this.params.required) {
			this.control.setValidators([Validators.required]);
		}
		this.file = null;
		this.control.setValue(null);
		this.removeFile.emit("remove");
	}
}
