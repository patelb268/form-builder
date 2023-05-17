import { DOCUMENT, formatDate } from "@angular/common";
import { EventEmitter, Inject, Injectable } from "@angular/core";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { MatSidenav } from "@angular/material/sidenav";
import { Auth } from "auxilium-connect";
import { BehaviorSubject, interval, Observable, Subject } from "rxjs";
import { map } from "rxjs/operators";
import {
	ConfirmDialogComponent,
	ConfirmDialogParams,
} from "../components/confirm-dialog/confirm-dialog.component";
import { DebugComponent } from "../components/debug/debug.component";
import { LanguageDef, TranslatePipe } from "../pipes/translate.pipe";
import { ApiService } from "./api.service";
import { NotifyService } from "./notify.service";
import { SliceService } from "./slice.service";
import { StorageService } from "./storage.service";
import { TitleService } from "./title.service";

enum STORAGE_KEYS {
	LEFT_NAV_OPEN = "app-sidenav-closed",
	LEFT_NAV_MODE = "app-sidenav-mode",
	LEFT_NAV_WIDTH = "app-sidenav-width",
}

@Injectable({
	providedIn: "root",
})
export class AppService {
	extentions = ["pdf", "jpg", "jpeg", "png"];
	auth: Observable<Auth>;
	env: any;
	hideUi = new BehaviorSubject(false);
	languageChanged = this._translate.change;
	refreshNav = new Subject();
	leftNav: MatSidenav;
	leftNavOpen = new BehaviorSubject<boolean>(
		!!this._storage.get(STORAGE_KEYS.LEFT_NAV_OPEN)
	);
	leftNavMode = new BehaviorSubject<"side" | "over" | "push">(
		this._storage.get(STORAGE_KEYS.LEFT_NAV_MODE) || "side"
	);
	leftNavWidth: number =
		this._storage.get(STORAGE_KEYS.LEFT_NAV_WIDTH) || 250;
	now = interval(1000).pipe(map(() => new Date()));
	// generic events that are triggered via keyboard shortcuts
	save: EventEmitter<void> = new EventEmitter();
	// find: EventEmitter<void> = new EventEmitter();

	// ensure this is declared after all of your mapped emitters
	shortcuts = {
		// [F]: this.find,
		s: this.save,
	};

	private _duplicateContent = null;

	get duplicateContent() {
		return this._duplicateContent;
	}

	set duplicateContent(c){
		this._duplicateContent = c;
	}


	private _languages: { id: string; label: string }[];

	constructor(
		private _api: ApiService,
		private _dialog: MatDialog,
		private _translate: TranslatePipe,
		public notify: NotifyService,
		@Inject(DOCUMENT) private _doc: Document,
		private _storage: StorageService,
		public title: TitleService,
		private _slices: SliceService
	) {
		const sock = _api.socket;

		this.auth = _api.auth;

		// load up the dictionary, and listen to changes..
		this._loadDictionary();
		_translate.change.subscribe(() => this._loadDictionary());

		addEventListener("keydown", (evt) => {
			const meta = !!evt.metaKey,
				emitter = this.shortcuts[evt.key] as EventEmitter<any>;
			// console.warn('check keycode ', evt.key);
			if (meta && emitter) {
				if (emitter.observers && emitter.observers.length) {
					emitter.emit();
					evt.preventDefault();
					evt.cancelBubble = true;
				}
			}
		});
		this._api.request({'$/env/all': {}}).subscribe(y=>this.env = y);
	}

	private _formatDate: string;
	private _formatDateTime: string;
	private _formatTime: string;
	private _locale: string;

	private _loadDictionary() {
		const t = this._translate;
		this._formatDate = t.transform("format_date") || "mediumDate";
		this._formatDateTime = t.transform("format_datetime") || "medium";
		this._formatTime = t.transform("format_time") || "shortTime";
		this._locale = TranslatePipe.locale;
		console.log("loadeded locale!!");
	}

	formatDate(date: Date, noDate = "", formatter?: string) {
		return date
			? formatDate(date, formatter || this._formatDate, this._locale)
			: noDate;
	}
	formatDateTime(date: Date, noDate = "", formatter?: string) {
		return date
			? formatDate(date, formatter || this._formatDateTime, this._locale)
			: noDate;
	}
	formatTime(date: Date, noDate = "", formatter?: string) {
		return date
			? formatDate(date, formatter || this._formatTime, this._locale)
			: noDate;
	}

	translate(text: string, obj?: any) {
		return this._translate.transform(text, obj);
	}

	changeLanguage(to: keyof LanguageDef) {
		return this._translate.changeLanguage(to);
	}

	get language() {
		return this._translate.language;
	}

	get languages() {
		return (
			this._languages ||
			(this._languages = this._translate.getAsOptions())
		);
	}

	get spoke() {
		return this._api.spoke;
	}

	getCurrentAuth() {
		return this._api.getCurrentAuth();
	}

	logout(all?: boolean) {
		return this._api.logout(all);
	}

	showDebug() {
		this._dialog.open(DebugComponent, {
			maxHeight: "95vh",
			maxWidth: "95vw",
			width: "95vw",
			height: "95vh",
		});
	}

	showLogin() {
		return this._api.showLogin();
	}

	confirm(data: ConfirmDialogParams, config?: MatDialogConfig) {
		return this._dialog
			.open(ConfirmDialogComponent, Object.assign({}, config, { data }))
			.afterClosed()
			.pipe(map((r) => !!r));
	}

	downloadFile(filename: string, blob: Blob) {
		const url = URL.createObjectURL(blob),
			doc = this._doc,
			link = doc.createElement("a");
		doc.body.appendChild(link);
		link.href = url;
		link.download = filename;
		link.click();
		URL.revokeObjectURL(url);
		doc.body.removeChild(link);
	}

	toggleLeftSidenav() {
		this.leftNav.toggle();
		const opened = this.leftNav.opened;
		this._storage.set(STORAGE_KEYS.LEFT_NAV_OPEN, !!opened);
		this.leftNavOpen.next(opened);
	}

	getExtension(fname) {
		var pos = fname.lastIndexOf(".");
		var strlen = fname.length;
		if (pos != -1 && strlen != pos + 1) {
			var ext = fname.split(".");
			var len = ext.length;
			var extension = ext[len - 1].toLowerCase();
		} else {
			extension = false;
		}
		const isValid = this.extentions.includes(extension);
		return isValid ? extension : false;
	}

	get baseUrl() {
		const l = location;
		return `${l.protocol}//${l.hostname}/`;
	}
}
