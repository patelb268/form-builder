import {
	Component,
	ChangeDetectionStrategy,
	OnInit,
	ChangeDetectorRef,
	ViewChild,
	ElementRef,
	OnDestroy,
} from "@angular/core";
import { AppService } from "@services/app.service";
import { environment } from "src/environments/environment";
import { ApiService } from "@services/api.service";
import { AuthRow } from "auxilium-connect";
import { MatSidenav, MatSidenavContainer } from "@angular/material/sidenav";
import {
	take,
	debounceTime,
	takeWhile,
	filter,
	switchMap,
} from "rxjs/operators";
import { StorageService } from "@services/storage.service";
import { CdkDragStart, CdkDragRelease, CdkDrag } from "@angular/cdk/drag-drop";

enum STORAGE_KEYS {
	LEFT_NAV_WIDTH = "app-left-nav-width",
}

@Component({
	selector: "app-root",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit, OnDestroy {
	auth: AuthRow;
	expanded = new Set<number>();
	expandedColor = new Set<string>();
	collapseExpanded = false;
	readonly env = environment;
	showEnvironments = false;
	environmentItems: any = null;
	@ViewChild("leftNav", { read: MatSidenav, static: true })
	leftNav: MatSidenav;
	@ViewChild("leftNav", { read: ElementRef, static: true })
	leftNavContainer: ElementRef<HTMLElement>;
	leftNavRender = false;
	leftNavDefaultWidth = 250;
	@ViewChild("resizer", { read: CdkDrag, static: true }) resizer: CdkDrag;
	@ViewChild("sidenav", { read: MatSidenavContainer, static: true })
	sidenav: MatSidenavContainer;
	spoke: string;

	private _destroyed = false;
	private _dragStartWidth: number;
	private _dragDelay = 66;

	constructor(
		public app: AppService,
		private _api: ApiService,
		private _cd: ChangeDetectorRef,
		private _storage: StorageService
	) {}

	endAssumed() {
		this.app
			.confirm({
				message: "confirm_unassume",
				translate: true,
			})
			.pipe(
				filter((r) => !!r),
				switchMap(() => this._api.logout())
			)
			.subscribe(() => this._cd.detectChanges());
	}

	sidenavDragStart(ev: CdkDragStart) {
		const width = (this._dragStartWidth =
				this.leftNavContainer.nativeElement.offsetWidth),
			sizer = ev.source.element.nativeElement,
			size = sizer.offsetWidth;
		ev.source.element.nativeElement.style.left = `${width - size}px`;
	}
	sidenavDragReleased(ev: CdkDragRelease) {
		setTimeout(() => {
			this._dragStartWidth = null;
			ev.source.element.nativeElement.style.removeProperty("left");
			ev.source.reset();
			this.sidenav.updateContentMargins();
		}, this._dragDelay + 1);
	}

	isExpandedClass(id){
		return window.location.href.indexOf(id)>-1 ? true: false;
	}

	logout() {
		this._api.logout().subscribe((resp) => this._cd.detectChanges());
	}

	ngOnInit() {
		const leftNavWidth: number = this._storage.get(
			STORAGE_KEYS.LEFT_NAV_WIDTH
		);

		this.app.languageChanged.subscribe(() => this._cd.detectChanges());

		this._checkTitle();

		this.app.auth.subscribe((a) => (this.auth = a)); // needed for the user menu
		this.spoke = this._api.spoke; // needed for the user menu also

		this.leftNav.openedStart
			.pipe(debounceTime(100), take(1))
			.subscribe(() => {
				this.leftNavRender = true;
				this._cd.detectChanges();
			});

		this.app.leftNav = this.leftNav;

		this.resizer.moved
			.pipe(
				debounceTime(this._dragDelay),
				takeWhile(() => !this._destroyed)
			)
			.subscribe((ev) => {
				const elem = this.leftNavContainer.nativeElement;
				elem.style.width = `${this._dragStartWidth + ev.distance.x}px`;
				this.sidenav.updateContentMargins();
				this._storage.set(
					STORAGE_KEYS.LEFT_NAV_WIDTH,
					elem.offsetWidth
				);
			});

		this.leftNavContainer.nativeElement.style.width = `${
			leftNavWidth || this.leftNavDefaultWidth
		}px`;
	}

	ngOnDestroy() {
		this._destroyed = true;
	}

	private get _sidenavScrollElement() {
		return this.leftNavContainer.nativeElement.querySelector(
			".mat-drawer-inner-container"
		);
	}

	private _checkTitle() {
		const chunks = this.app.title.getTitle().split("**"),
			len = chunks.length;
		if (len === 3 && !chunks[0] && !chunks[len - 1]) {
			console.warn(
				"your app title has no been set - please edit the index.html"
			);
		}
	}

	onShowChildEnviornmentByParent(item: ContainerItem) {
		if (item) {
			this.showEnvironments = true;
			item.children = item.children.filter((r) => r.id);
			this.environmentItems = item;
		} else {
			this.showEnvironments = false;
			this.environmentItems = {};
		}
	}
	isNavContainsSlice(item) {
		if (document.URL.indexOf(item.link) >= 0) {
			return true;
		}
		return false;
	}

	clearExpansion() {
		this.collapseExpanded = true;
	}
	containerStateChange(item: ContainerItem, opened: boolean, depth = 0) {
		this.collapseExpanded = false;
		console.log(this.collapseExpanded)
		const exp = this.expanded;
		if (depth < 1) {
			this.expanded.clear();
		}
		if (opened) {
			if (item.id < 0) {
				exp.add(item.dashboard);
			} else {
				exp.add(item.id);
			}
		} else {
			exp.delete(item.id);
		}
	}

	setExpandedColor(id) {
		this.expandedColor.clear();
		this.expandedColor.add(id);
	}
}

interface ContainerItem {
	id: number;
	type: "container";
	label: string;
	expanded: boolean;
	quickActions?: ActionItem[];
	moreActions?: ActionItem[]; // this holds the HAMBURGER menu options, in tree structure that can be serialized
	children: ChildItem[];
	dashboard?: number;
}

interface ChildItemLink {
	type: "link";
	label: string;
	link: string;
	hint: string;

	icon?: string;
	disabled?: boolean;
	shared?: boolean;
	id?: number;
	parent?: string;
}

type ActionItem = ChildItemLink;

type ChildItem = ContainerItem | ChildItemLink;
