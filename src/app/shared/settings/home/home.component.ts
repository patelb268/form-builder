import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { AppService } from '@services/app.service';
import { LegacyActionsService } from '@services/legacy-actions.service';
import { Auth } from 'auxilium-connect';
import { takeWhile, switchMap, tap, map, filter } from 'rxjs/operators';
import { SliceService, SliceChangesEvent } from '@services/slice.service';
import { BehaviorSubject } from 'rxjs';
import { SliceRow, SLICE_CATEGORY } from 'src/app/shared/models/slice';
import { RoutingService } from '@services/routing.service';
import { sortObjectArrayByProperty } from '../../utils/sortObjectArrayByProperty';
import { TranslatePipe } from '../../pipes/translate.pipe';

interface ShowObj {
	myaccount?: boolean;
	clients?: boolean;
	emails?: boolean;
	roles?: boolean;
	users?: boolean;
	dashboards?: boolean;
	notifications?: boolean;
	environment?: number;
	keyval?: boolean;
	mailinglists?: {
		create?: boolean;
		edit?: boolean;
	};
}

interface ExpandObj {
	mailinglists?: boolean;
}

enum EXPAND_KEYS {
	MAILING_LIST = 'mailinglists'
}

@Component({
	selector: 'app-settings-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss'],
	
})
export class HomeComponent implements OnInit, OnDestroy {

	private _destroyed = false;
	private _allSlices = new BehaviorSubject<SliceRow[]>(null);

	show: ShowObj = {};
	expand: ExpandObj = {};
	loading = new BehaviorSubject(true);

	mailingLists = this._allSlices
		.pipe(
			map(all => all
				.filter(this._slices.isMailingList)
				.sort(sortObjectArrayByProperty('name'))
			),
		);


	constructor(
		public app: AppService,
		public routing: RoutingService,
		public legacy: LegacyActionsService,
		// private _cd: ChangeDetectorRef,
		private _slices: SliceService,
	) { }

	toggleExpand(key: keyof ExpandObj) {
		const e = this.expand,
			newVal = !e[key];
		e[key] = !e[key];
		if (!newVal) {
			localStorage.removeItem(`settings.expand.${key}`);
		} else {
			localStorage.setItem(`settings.expand.${key}`, '1');
		}
	}

	deleteMailingList(slice: SliceRow) {
		const trans = TranslatePipe.instance,
			args = {x: trans.transform(SLICE_CATEGORY.MAILING_LIST)};

		this.app
			.confirm({message: trans.transform('confirm_delete_x', args)})
			.pipe(
				filter(yes => !!yes),
				switchMap(() => this._slices.delete(slice.id))
			)
			.subscribe(resp => {
				if (resp) {
					this.app.notify.success(trans.transform('x_deleted', args));
					// this._allSlices.next(this._allSlices.getValue().filter(x => x.id !== slice.id));
				} else {
					this.app.notify.warn(trans.transform('error_deleting_x', args));
				}
			});
	}

	ngOnInit(): void {
		const app = this.app,
			exp = this.expand,
			keys: (keyof ExpandObj)[] = ['mailinglists'];

		keys.forEach(k => {
			exp[k] = !!localStorage.getItem(`settings.expand.${k}`);
		});

		this.app.auth.pipe(
			tap(() => {
				this.show = {};
				this.loading.next(true);
			}),
			takeWhile(() => !this._destroyed),
			switchMap(() => this._slices.all()),
		)
		.subscribe(resp => this._load(app.getCurrentAuth(), resp));

		this._slices
			.changes
			.subscribe((ev: SliceChangesEvent) => {
				const all = this._allSlices.getValue();
				ev?.created?.forEach(s => all.push(s.rawInitRow));
				ev?.modified?.forEach(s => {
					const idx = all.findIndex(x => x.id === s.id);
					if (idx > -1) {
						all[idx] = s.rawInitRow;
					}
				});
				ev?.removed?.forEach(id => {
					const idx = all.findIndex(x => x.id === id);
					if (idx > -1) {
						all.splice(idx, 1);
					}
				});
				this._allSlices.next(all);
			});
	}

	ngOnDestroy() {
		this._destroyed = true;
	}

	private _load(auth: Auth, slices: SliceRow[]) {

		console.log('load', {auth, slices});

		const admin = auth.admin,
			sysadmin = !!(admin.system),
			// tableadmin = !!(admin.table),
			useradmin = !!(admin.user),
			show = this.show;

		show.myaccount = !auth.guest;
		show.users = sysadmin || useradmin;
		show.dashboards = sysadmin;
		show.notifications = true;
		show.roles = slices.some(s => !!s.role && s.perms?.modify); // can we modify anything designated as a role?
		show.emails = slices.some(s => s.perms?.share);  // can we share anything?
		show.clients = this.app.spoke === 'template';
		show.environment = sysadmin ? auth.hitched?.settings.find(s => s.key === 'applications')?.id : 0;
		show.keyval = sysadmin;
		show.mailinglists = auth.guest ? {} : {
			create: this._slices.canCreateMailingLists(slices),
			edit: !!(slices.filter(s => this._slices.isMailingList(s) && s?.perms?.modify))
		};

		this._allSlices.next(slices);

		this.loading.next(false);
	}
}
