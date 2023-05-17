import {
	Component,
	OnInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Output,
	EventEmitter
} from '@angular/core';
import { AppService } from '@services/app.service';
import { SliceService } from '@services/slice.service';
import { Nav, NavMeta } from 'src/app/shared/models/nav';
import { switchMap, tap, take, map, startWith } from 'rxjs/operators';
import { sortObjectArrayByProperty } from 'src/app/shared/utils/sortObjectArrayByProperty';
import { RoutingService } from '@services/routing.service';
import { Slice, SliceRow } from 'src/app/shared/models/slice';
import { StorageService } from '@services/storage.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { UntypedFormControl } from '@angular/forms';
import { searchStringToArrayPipe } from 'src/app/shared/utils/searchStringToArray';
import { Router } from '@angular/router';
import { orderBy, sortBy } from 'lodash';

interface ChildItemLink {
	type: 'link';
	label: string;
	link: string;
	hint: string;
	color?: string;
	bold?: boolean;
	icon?: string;
	disabled?: boolean;
	shared?: boolean;
	id?: number;
	parent?: string;
	hideOnLeftNav?: number;
}

type ActionItem = ChildItemLink;
// type MenuItem =

interface ContainerItem {
	id: number;
	type: 'container';
	label: string;
	expanded: boolean;
	quickActions?: ActionItem[];
	moreActions?: ActionItem[]; // this holds the HAMBURGER menu options, in tree structure that can be serialized
	children: ChildItem[];
	dashboard?: number;
	color?: string;
	hideOnLeftNav?: number;
}

type ChildItem = ContainerItem | ChildItemLink;

enum STORAGE_KEYS {
	EXPANDED = 'sidenav-expanded',
	ACTIVE_TAB = 'sidenav-active-tab',
	TAB_SCROLL_TOP_PREFIX = 'sidenav-tab-top-',
	SEARCH_VALUE = 'sidenav-search-value'
}

@Component({
	selector: 'app-sidenav',
	templateUrl: './sidenav.component.html',
	styleUrls: ['./sidenav.component.scss'],
})
export class SidenavComponent implements OnInit {
	expanded: Set<number>;
	selectedNav = null;
	isReady = false;
	items: ContainerItem[] = [];
	slicesWithMeta = null;
	rawItems: ContainerItem[] = [];
	loading = new BehaviorSubject<boolean>(true);
	@Output() ready = new EventEmitter<void>();
	@Output() requiresResize = new EventEmitter<void>();
	searchControl = new UntypedFormControl(
		this._storage.get(STORAGE_KEYS.SEARCH_VALUE)
	);
	searchResults: Observable<ChildItemLink[]>;
	selectedTabIndex: number = +(
		this._storage.get(STORAGE_KEYS.ACTIVE_TAB) || 0
	);

	@Output()
	showChildEnviornmentByParent = new EventEmitter<ContainerItem>();

	constructor(
		public app: AppService,
		private _slices: SliceService,
		private _cd: ChangeDetectorRef,
		private _routing: RoutingService,
		private _storage: StorageService,
		private router: Router
	) {}

	ngOnInit() {
		this.router.routeReuseStrategy.shouldReuseRoute = () => false;
		console.log('searchControl', this.searchControl);

		this.setDefaultData();

		this.app.refreshNav.subscribe((e) => {
			this.setDefaultData();
		});
	}

	isNavContainsSlice(item) {
		if (document.URL.indexOf(item.link) >= 0) {
			return true;
		}
		return false;
	}

	setDefaultData() {
		this.app.auth
			.pipe(
				tap(() => this._clear()),
				switchMap(() => this._slices.navData())
			)
			.subscribe((data) => this._load(data));

		this.expanded = new Set(this._storage.get(STORAGE_KEYS.EXPANDED) || []);

		this.searchResults = this.searchControl.valueChanges.pipe(
			tap((s) => this._storage.set(STORAGE_KEYS.SEARCH_VALUE, s || '')),
			startWith(this.searchControl.value),
			searchStringToArrayPipe(500),
			map((terms) => terms.map((term) => new RegExp(term, 'i'))),
			map((search) => {
				const candidates = this.rawItems?.length
					? this.rawItems
					: this.items;
				if (!search || !search.length) {
					return null;
				} else {
					return this._searchItems(search, candidates, []).sort(
						(a, b) => {
							let x = a.label.toLowerCase(),
								y = a.label.toLowerCase();
							if (x < y) {
								return -1;
							} else if (x > y) {
								return 1;
							} else {
								x = a.parent.toLowerCase();
								y = b.parent.toLowerCase();
								return x < y ? -1 : x > y ? 1 : 0;
							}
						}
					);
				}
			})
		);
	}

	routeToHome() {
		this.router.navigate([this._routing.home()]);
		this.expanded.clear();
	}

	containerStateChange(item: ContainerItem, opened: boolean, depth = 0) {
		const exp = this.expanded;
		if (depth < 1) {
			this.expanded.clear();
		}
		if (opened) {
			if (item.id < 0) {
				exp.add(item.id);
			} else {
				exp.add(item.id);
			}
		} else {
			exp.delete(item.id);
		}
		this._storage.set(STORAGE_KEYS.EXPANDED, Array.from(exp));
		if (item.id < 1) {
			this.showChildEnviornmentByParent.emit(item);
		} else {
			this.showChildEnviornmentByParent.emit(null);
		}
	}

	tabSelectedChange(evt: MatTabChangeEvent) {
		this._storage.set(STORAGE_KEYS.ACTIVE_TAB, evt.index);
		this.requiresResize.emit();
	}

	private _searchItems(
		search: RegExp[],
		items: ChildItem[],
		accumulate: ChildItemLink[]
	) {
		items.forEach((item) => {
			if (item.type === 'link') {
				const match = search.every(
					(re) =>
						re.test(item.label) ||
						(item.id ? re.test('' + item.id) : false) ||
						
						(item.parent ? re.test(item.parent) : false) 
				);
				if (match) {
					accumulate.push(item);
				}
			} else if (item.type === 'container' && item.children?.length) {
				this._searchItems(search, item.children, accumulate);
			}
		});
		return accumulate;
	}

	private _clear() {
		this.items.length = 0;
		this._cd.detectChanges();
	}

	private _load(nav: Nav) {
		this._slices.getAllSliceDetailWithMeta().subscribe((allInfo) => {
			this.slicesWithMeta = allInfo[1]?.rows;

			// what is the ideal structure here?
			const config = nav.config || {},
				slices = nav.slices,
				sliceKeys = new Set(slices.map((s) => s.id)),
				items: ContainerItem[] = (this.items = []),
				rawItems: ContainerItem[] = (this.rawItems = []),
				forms = new Map<number | string, number>(
					Object.entries(nav.meta)
						.filter(
							([key, val]) => !!val.form && sliceKeys.has(+key)
						)
						.map(([key, val]) => [val.form, +key])
				),
				inApp = new Set<number>(),
				hidden = new Set(nav.config.hideSlices),
				admin = this.app.getCurrentAuth().admin;

			config.applications.forEach((app) => {
				const children: ChildItem[] = [],
					quickActions: ActionItem[] = [],
					moreActions: ActionItem[] = [],
					item: ContainerItem = {
						id: app.id,
						type: 'container',
						label: app.name,
						expanded: false,
						dashboard: app.dashboard || 0,
						children,
						quickActions,
						moreActions
					};

				// run through the actions
				(app.actions || []).forEach((a) => {
					// const meta = nav.meta[formSlice]
					switch (a.action) {
						case 'addRecord':
							const formSlice =
									forms.get(a.params) || forms.get(+a.params),
								meta = nav.meta[formSlice];
							children.push(
								this._createAddFormRecord(
									forms.get(a.params) || forms.get(+a.params),
									a.params,
									a.label,
									meta?.singular
								)
							);
							break;
						default:
							console.warn('unhandled action', a);
					}
				});

				(app.children || []).forEach((c) => {
					const container = this._buildChildContainer(
						c.slice,
						nav,
						forms
					);
					if (container) {
						children.push(container);
					}
					inApp.add(c.slice);
				});

				// if (app.name === 'FCL / ME') {
				// 	debugger;
				// }

				if (item.children.filter((c) => !!c).length) {
					if (app.dashboard) {
						const dash = nav.dashboards[app.dashboard];
						if (dash) {
							children.unshift(
								this._createViewDashboard(
									app.dashboard,
									dash.name,
									item.label
								)
							);
						}
					}
					items.push(item);
				}
			});

			nav.slices
				.filter((s) => this._isContainerSlice(s)) // and are valid containers
				.forEach((s) => {
					const showInHome = !inApp.has(s.id) && !hidden.has(s.id),
						container =
							admin.system || admin.table || showInHome
								? this._buildChildContainer(s.id, nav, forms)
								: null;

					if (container) {
						if (admin) {
							rawItems.push(container);
						}
						if (showInHome) {
							items.push(container);
						}
					}
				});

			// sort the items
			items.sort(sortObjectArrayByProperty('label'));
			rawItems.sort(sortObjectArrayByProperty('label'));

			this.loading.next(false);
			this.isReady = true;
			this._cd.detectChanges();

			this.requiresResize.emit();
			this.ready.emit();
		});
	}

	private _isChildReport(parentId: number, slice: Slice | SliceRow) {
		return (
			slice.parent === parentId &&
			slice?.perms?.report &&
			slice.category === 'report'
		);
	}

	private _isContainerSlice(slice: Slice | SliceRow) {
		return (
			!slice.parent && // unparented/root slices
			slice?.perms?.report && // have report perms
			slice?.source_db?.split('_').pop() !== 'datalynk' && // tables inside the datalynk db
			slice.category?.toLowerCase() !== 'hideonleftnav' // manually hidden
		);
	}

	private _buildChildContainer(
		sliceId: number,
		nav: Nav,
		forms: Map<number | string, number>
	): ContainerItem {
		const slice = nav.slices.find((s) => s.id === sliceId);
		if (!slice) {
			return null;
		}

		let children: ChildItem[] = nav.slices
			.filter((s) => this._isChildReport(sliceId, s))
			.map((s) =>
				this._createViewReport(s, nav.meta[s.id], '', slice.name)
			)
			.filter((x) => !!x);

		if (nav.meta && !slice.parent) {
			Object.keys(nav.meta).forEach((re) => {
				const metaInfo = this.slicesWithMeta.find((y) => y.id === +re);

				const includeIn: any[] = nav.meta[re].includeIn;
				if (includeIn && includeIn.length) {
					const isReportIncluded = includeIn.includes(slice.id);
					if (isReportIncluded) {
						const includedSliceInfo: SliceRow = nav.slices.find(
							(y) => y.id === +re
						);
						const includedSliceMetaInfp =
							nav.meta[includedSliceInfo.id];
						const parentOfIncludedRpt = nav.slices.find(
							(s) => s.id === includedSliceInfo.parent
						);
						if (
							includedSliceInfo &&
							slice.id !== parentOfIncludedRpt.id
						) {
							const childSlicItem: ChildItem = {
								type: 'link',
								label: includedSliceInfo.name,
								hint:
									includedSliceMetaInfp.description ||
									includedSliceInfo.name,
								link: this._routing.reportView(
									includedSliceInfo.id,
									includedSliceMetaInfp?.type
								),
								color: metaInfo.meta.presentation.titleColor,
								hideOnLeftNav:
									metaInfo.meta.presentation.hideOnLeftNav,

								bold: metaInfo.meta.presentation.titleBold,
								icon: `screen_share`,
								parent: parentOfIncludedRpt.name + ''
							};
							children = children.concat(childSlicItem);
						}
					}
				}
			});
		}
		children = sortBy(children, (y) => y.label.toLowerCase());

		const quickActions: ActionItem[] = [],
			moreActions: ActionItem[] = [],
			container: ContainerItem = {
				id: slice.id,
				type: 'container',
				label: slice.name,
				expanded: false,
				children,
				quickActions,
				moreActions
			},
			meta = nav.meta[sliceId] || null,
			formId = meta?.form;

		if (slice?.perms?.insert) {
			quickActions.push(
				this._createAddFormRecord(
					sliceId,
					formId,
					null,
					meta?.singular || null
				)
			);
			quickActions.push(
				this._createImportData(sliceId, null, meta?.plural)
			);
		}
		if (slice?.perms?.modify) {
			moreActions.unshift(this._createFormEdit(sliceId, formId));
			moreActions.push(this._createSchemaEdit(sliceId));
			moreActions.push(this._createImportCSV(sliceId));
		}
		
		if (slice?.perms?.share) {
			moreActions.push(this._createManageTemplates(sliceId));
		}
		// scan for any slices that are "includedIn" to this slice
		(meta?.includeIn || []).forEach((includeId) => {
			// check if the target slice exists, and we have the appropriate perms first... (pass the filter condition)
			console.warn('include this slice/report also\n\n', {
				includeId,
				sliceId
			});
		});

		if (children.length || quickActions.length || moreActions.length) {
			// check for a dashboard, after everything else has been checked
			// since a dashboard should only display IF they have access to
			// something else
			return container;
		}
		return null;
	}

	private _createAddFormRecord(
		sliceId: number,
		formId: number | string,
		label?: string,
		singular?: string
	): ChildItemLink {
		singular = singular || 'Record';
		label = label || this.app.translate('add_record', { singular });
		return {
			type: 'link',
			label,
			hint: label,
			link: this._routing.formAddRecord(sliceId, formId || 0),
			icon: 'icon_add_record'
		};
	}

	private _createImportData(
		sliceId: number,
		label?: string,
		plural?: string
	): ChildItemLink {
		plural = plural || 'Records';
		label = label || this.app.translate('import_records', { plural });
		return {
			type: 'link',
			label,
			hint: label,
			link: this._routing.importData(sliceId),
			icon: 'icon_import'
		};
	}

	private _createFormEdit(
		sliceId: number,
		formId: number | string,
		label?: string
	): ChildItemLink {
		label = label || this.app.translate('edit_form');
		return {
			type: 'link',
			label,
			hint: label,
			link: this._routing.formEdit(sliceId, formId),
			icon: 'icon_edit_form'
		};
	}

	private _createViewReport(
		slice: Slice | SliceRow,

		meta: NavMeta,
		label?: string,
		parent?: string
	): ChildItemLink {
		const metaInfo = this.slicesWithMeta.find((y) => y.id === +slice.id);
		parent = parent || '';
		label = label || slice.name;
		return {
			type: 'link',
			label,
			hint: meta?.description || label,
			link: this._routing.reportView(slice.id, meta?.type),
			icon: `icon_report_${meta?.type || 'grid'}`,
			color: metaInfo?.meta?.presentation?.titleColor,
			hideOnLeftNav: metaInfo?.meta?.presentation?.hideOnLeftNav,
			bold: metaInfo?.meta?.presentation?.titleBold,
			parent
		};
	}

	private _createViewDashboard(
		dashId: number,
		label?: string,
		parent?: string
	): ChildItemLink {
		(parent = parent || ''),
			(label = label || this.app.translate('view_dashboard'));
		return {
			type: 'link',
			label,
			hint: label,
			link: this._routing.dashboardView(dashId),
			icon: `icon_dashboard`
		};
	}

	private _createSchemaEdit(sliceId: number, label?: string): ChildItemLink {
		label = label || this.app.translate('edit_schema');
		return {
			type: 'link',
			label,
			hint: label,
			link: this._routing.schemaEdit(sliceId),
			icon: `icon_schema`
		};
	}

	private _createImportCSV(sliceId: number, label?: string): ChildItemLink {
		label = label || this.app.translate('Import CSV');
		return {
			type: 'link',
			label,
			hint: label,
			link: this._routing.CSVUpload(sliceId),
			icon: `icon_schema`
		};
	}

	private _createManageTemplates(
		sliceId: number,
		label?: string
	): ChildItemLink {
		label = label || this.app.translate('manage_templates');
		return {
			type: 'link',
			label,
			hint: label,
			link: this._routing.manageTemplates(sliceId),
			icon: `icon_templates`
		};
	}

	test(i) {
		console.log(i, 'ds');
	}
}
