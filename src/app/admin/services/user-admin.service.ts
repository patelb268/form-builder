import { Injectable } from '@angular/core';
import { ApiService } from '@services/api.service';
import { AuthRow, ApiXPermsResponse, Auth, Api } from 'auxilium-connect';
import { catchError, map, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { SliceRow } from 'src/app/shared/models/slice';
import { UserAgentService } from '@services/user-agent.service';

export type UserProfileAuth = AuthRow & {active?: number, sysadmin?: number, userId?: number};

// this will likely get expanded
export interface AuthHistoryRow {
	agent?: string;
	authEmail: string;
	authId: number;
	cancel?: Date;
	ended?: Date;
	expire: Date;
	guid?: string; // this is the token that we expire on
	impersonatedBy?: string;
	id?: string;
	self?: number;
	started: Date;

	// filled by frontend
	device: any;
}

export interface UserProfile {
	auth: UserProfileAuth;
	perms: ApiXPermsResponse;
	user: {
		id: number;
		active: string;
		sysadmin: string;
	};
	userPerms: ApiXPermsResponse;
	roles: SliceRow[];
	membership: number[];
	sessions: AuthHistoryRow[];
}

@Injectable({
	providedIn: 'root'
})
export class UserAdminService {

	constructor(
		private _api: ApiService,
		private _ua: UserAgentService,
	) { }

	canAdminUser() {
		const admin = this._api.getCurrentAuth()?.admin;
		return !!(admin?.system || admin?.user);
	}

	canAssumeUser(id: number) { // only sysadmins can assume OTHER users
		const self = this._api.getCurrentAuth();
		return !!(self.id !== id && self?.admin.system);
	}

	canExpirePassword(id: number) { // sysadmin/useradmin can expire OTHER passwords
		const self = this._api.getCurrentAuth(),
			admin = self?.admin;
		return !!((admin?.system || admin?.user) && id && id !== self.id);
	}

	assume(id: number) {
		return this._api
			.assume(id)
			.pipe(
				catchError(() => of(false)),
				map(auth => !!auth)
			);
	}

	expirePassword(ids: number[]) {
		const date = new Date();
		return this._api
			.updateRows('auth', ids.map(id => ({id, expire_password: date})))
			.pipe(
				map(r => r.success ? date : null)
			);
	}

	expireSession(id: string) {
		return this._api.request({'$/auth/expireToken': {tokenId: id}});
	}

	unexpirePassword(ids: number[]) {
		return this._api.updateRows('auth', ids.map(id => ({id, expire_password: null})));
	}

	userProfile(id: number) {
		return this._api
			.request<UserProfile>({'$/tools/do': [
				'auth', {'!/env/auth/report': {fields: {
					'*': '*',
					userId: ['$add', 0, ['$first', ['$field', 'ᗕ All Users by auth_ref:id']]],
					active: ['$add', 0, ['$count', ['$field', 'ᗕ All Users by auth_ref:id'], ['$field', 'ᗕ All Users by auth_ref:active']]],
					sysadmin: ['$add', 0, ['$count', ['$field', 'ᗕ All Users by auth_ref:id'], ['$field', 'ᗕ All Users by auth_ref:sysadmin']]],
				},
				where: {id}}},
				'perms', {'!/env/auth/xperms': {mask: 'udq', pkeys: [id]}},
				'user', {'!/env/users/report': {fields: ['id', 'sysadmin', 'active'], where: {auth_ref: id}}},
				'userPerms', {'!/env/users/xperms': {mask: 'u', pkeys: [{$_: 'user:rows:0:id'}]}},
				'roles', {'!/slice/permissions_lite': {where: ['$and', ['$neq', ['$field', 'role'], null], ['$neq', ['$field', 'id'], 1]], order: [['$field', 'name']]}},
				'roleIds', {'!/tools/column': {col: 'id', rows: {$_: 'roles:rows'}}},
				'membership', {'!/slice/user_in_roles': {auth_ref: id, roles: {$_: 'roleIds'}}},
				'sessions', {'!/auth/history/list': {authIds: [id]}},
				// function list(Env $env, $authIds = null, $active = 1, $before = null, $after = null)
				// 'sessions', {'!/auth/history/tokens': {id: }}
				'resp', {
					auth: {$_: 'auth:rows:0', $_else: null},
					perms: {$_: 'perms', $_else: []},
					user: {$_: 'user:rows:0', $_else: null},
					userPerms: {$_: 'userPerms', $_else: []},
					roles: {$_: 'roles:rows', $_else: []},
					membership: {$_: 'membership', $_else: []},
					sessions: {$_: 'sessions:rows', $_else: []},
				}
			]}, {labelAs: `userProfile.${id}`})
			.pipe(
				map(r => ({
					auth: this._api.mixPermsIntoRows([r.auth], r.perms)[0],
					user: this._api.mixPermsIntoRows([r.user], r.userPerms)[0],
					roles: r.roles || [],
					membership: r.membership || [],
					sessions: this._ua.expandSessionRows(r.sessions),
				}))
			);
	}

}
