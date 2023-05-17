import { DOCUMENT } from '@angular/common';
import {
	ApplicationRef,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ComponentFactoryResolver,
	ElementRef,
	Inject,
	Injector,
	Input,
	OnDestroy,
	OnInit,
	Output,
	TemplateRef,
	ViewChild,
	ViewContainerRef
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionsService } from '@services/actions.service';
import { ApiService } from '@services/api.service';
import { AppService } from '@services/app.service';
import { ControlService } from '@services/control.service';
import { RoutingService } from '@services/routing.service';
import { postQueryTransformFn, SliceService } from '@services/slice.service';
import { AgGridAngular } from 'ag-grid-angular';
import {
	CellDoubleClickedEvent,
	CellEditingStartedEvent,
	CellEditingStoppedEvent,
	CellValueChangedEvent,
	ColDef,
	ColumnResizedEvent,
	FirstDataRenderedEvent,
	GetMainMenuItemsParams,
	GetRowIdFunc,
	GetRowIdParams,
	GridApi,
	GridReadyEvent,
	IServerSideDatasource,
	MenuItemDef,
	RowHeightParams,
	RowNode,
	ServerSideStoreType,
	SideBarDef,
	StartEditingCellParams,
	ValueFormatterParams,
	ValueGetterParams
} from 'ag-grid-community';
import { IsColumnFuncParams } from 'ag-grid-community/dist/lib/entities/colDef';
import 'ag-grid-enterprise';
import {
	ApiXDeleteResponse,
	ApiXUpdateResponse,
	PermBits
} from 'auxilium-connect';
import {
	BehaviorSubject,
	combineLatest,
	fromEvent,
	of,
	Subject,
	Subscription
} from 'rxjs';
import {
	distinctUntilChanged,
	filter,
	map,
	switchMap,
	take,
	takeWhile,
	tap
} from 'rxjs/operators';
import { WhereExpression } from 'src/app/shared/models/expression';
import { JotMetaPresentation } from 'src/app/shared/models/jot';
import {
	AdvancedXInsertResponse,
	LegacyMetaPresentation,
	Metadata,
	Relationship,
	Slice,
	SliceQueryParams,
	SliceRow
} from 'src/app/shared/models/slice';
import { TranslatePipe } from 'src/app/shared/pipes/translate.pipe';
import { ERRORS } from 'src/app/shared/utils/errors';
import { makeRelatedDisplayFormula } from 'src/app/shared/utils/makeRelatedDisplayFormula';
import { mixCustomFieldsIntoApiQuery } from 'src/app/shared/utils/mixCustomFieldsIntoApiQuery';
import { searchFields } from 'src/app/shared/utils/searchFields';
import {
	searchStringToArray,
	searchStringToArrayPipe
} from 'src/app/shared/utils/searchStringToArray';
import { FindAndReplaceAngularComponent } from '../../shared/components/find-and-replace-angular/find-and-replace-angular.component';
import {
	AgGridComponentData,
	AgGridFilterModel,
	AgGridFilterModelSingle,
	controls,
	DEFAULT_COLUMN_FILTERS,
	DisableFeatures,
	EDITOR,
	expressionExpander,
	GridSerialized,
	SerializedColDef
} from '../../shared/components/grid/ag-grid.lib';
import { difference, uniqBy } from 'lodash';
import {
	ConnectionPositionPair,
	Overlay,
	OverlayConfig,
	PositionStrategy
} from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { SocketService } from '@services/socket.service';
import * as _ from 'lodash';
import { DatepickerComponent } from 'src/app/shared/components/datepicker/datepicker.component';
import { DeleteDialogComponent } from 'src/app/shared/components/delete-dialog/delete-dialog.component';
import { DropdownEditComponent } from 'src/app/shared/components/dropdown-edit/dropdown-edit.component';
import { ActionIconComponent } from 'src/app/shared/components/grid/renderers/action-icon/action-icon.component';
import { DateTimeComponent } from 'src/app/shared/components/grid/renderers/date-time/date-time.component';
import { FileArrayComponent } from 'src/app/shared/components/grid/renderers/file-array/file-array.component';
import { HtmlRendererComponent } from 'src/app/shared/components/grid/renderers/html-renderer/html-renderer.component';
import { IconValueComponent } from 'src/app/shared/components/grid/renderers/icon-value/icon-value.component';
import { NotificationLinkComponent } from 'src/app/shared/components/grid/renderers/notification-link/notification-link.component';
import { RoutedIconComponent } from 'src/app/shared/components/grid/renderers/routed-icon/routed-icon.component';
import { RoutedLinkComponent } from 'src/app/shared/components/grid/renderers/routed-link/routed-link.component';
import { YesOrNoComponent } from 'src/app/shared/components/grid/renderers/yes-or-no/yes-or-no.component';
import { HeaderDialogService } from 'src/app/shared/components/header-dialog/header-dialog.service';
import { environment } from 'src/environments/environment';
import { HeaderComponent } from 'src/app/shared/components/grid/renderers/header/header.component';

export class Datasource implements IServerSideDatasource {
	// get dirty() {
	// 	return this._dirty;
	// }

	// private _dirty = new BehaviorSubject<boolean>(false);
	// private _dirtyMap = new Map</* row.id value */ any, object>(); // rowId, row
	saving = new BehaviorSubject(false);
	addingData: any[] = [];

	private _dirty = new BehaviorSubject<Map<any, object>>(new Map());
	private _delete = new BehaviorSubject<Set<any>>(new Set());
	public serverSideStoreType: ServerSideStoreType = 'partial';

	dirty = combineLatest([this._dirty, this._delete]).pipe(
		map(([dir, del]) => !!dir.size || !!del.size),
		distinctUntilChanged(),
		tap(() => console.log('dirty changed'))
	);

	constructor(
		private _comp: EmbedQueryGridComponent,
		private _api: ApiService
	) {}

	get sliceId() {
		return this._comp?.slice?.id;
	}

	get idColumn() {
		return this._comp.slice?.idField || 'id';
	}

	isRowDirty(row: any) {
		const id = (row || {})[this.idColumn];
		return this._dirty.getValue().has(id);
	}

	// getDirtyNewRows() {
	// 	const idCol = this.idColumn;

	// 	return Array.from(
	// 		this._dirty
	// 			.getValue()
	// 			.entries()
	// 		)
	// 		.filter(([k, v]) => +k < 0)
	// 		.map(([k, v]) => {

	// 			v
	// 		})
	// }

	// returns true/false if a "new" row was created in the dirty store
	cellChanged<T, K extends keyof T>(field: K, row: T) {
		const pk = this.idColumn as keyof T,
			id = row[pk],
			dirty = this._dirty,
			m = dirty.getValue(),
			existing = m.get(row[pk]),
			diff = { [field]: row[field] };
		let newlyCreated = false;

		if (existing) {
			Object.assign(existing, diff);
		} else {
			m.set(id, diff);
			newlyCreated = !!(+id < 0);
		}
		dirty.next(m);
		return newlyCreated;
	}

	toggleDeletion<T>(row: T) {
		const pk = this.idColumn as keyof T,
			id = row[pk],
			queue = this._delete.getValue(),
			addIdx = this.addingData.findIndex((a) => a[pk] === id),
			addRemoved = addIdx > -1;

		if (this.saving.getValue()) {
			return [false, false];
		} else if (addRemoved) {
			this.addingData.splice(addIdx, 1);
			queue.delete(id);
			const d = this._dirty.getValue();
			if (d.has(id)) {
				d.delete(id);
				this._dirty.next(d); // this MAY likely trigger a 2nd update
			}
		} else if (queue.has(id)) {
			queue.delete(id);
		} else {
			queue.add(id);
		}

		this._delete.next(queue);
		return [true, addRemoved];
	}

	isMarkedForDeletion<T>(row: T) {
		if (this._comp.selectedEntity.length > 0) {
			return row
				? this._delete.getValue().has(row[this.idColumn])
				: false;
		}
	}

	private _pruneDeletingRows<T>(rows: T[], deleting: Set<any>) {
		if (deleting?.size) {
			const idField = this.idColumn as keyof T;
			for (const id of deleting.values()) {
				const idx = rows.findIndex((r) => r[idField] === id);
				if (idx > -1) {
					rows.splice(idx, 1);
				}
			}
		}
		return rows;
	}

	private _prepareNewRowsForInsertion(rows: any[]) {
		return rows;
	}

	save() {
		const slice = this.sliceId,
			toBeRemoved = this._delete.getValue(),
			rows = this._pruneDeletingRows(this._getDirtyRows(), toBeRemoved),
			pk = this.idColumn,
			upd = rows.filter((r) => r[pk] > 0),
			ins = this._prepareNewRowsForInsertion(
				rows.filter((r) => !r[pk] || r[pk] <= 0)
			),
			del = Array.from(toBeRemoved),
			actions: any[] = [];

		if (rows.length || del.length) {
			this.saving.next(true);
			if (upd.length) {
				actions.push('update', {
					'!/slice/xupdate': { slice, rows: upd }
				});
			}
			if (ins.length) {
				actions.push('insert', {
					'!/slice/xinsert': { slice, rows: ins }
				});
			}
			if (del.length) {
				actions.push('remove', {
					'!/slice/xdelete': { slice, pkeys: del }
				});
			}
			actions.push('all', { $_: '*' });
			if (
				this._comp.widthChanged ||
				this._comp.orderChanged ||
				this._comp.isColumnSorted
			) {
				this.saveLayoutChanges();
			}
			return this._api
				.request<{
					update?: ApiXUpdateResponse;
					insert?: AdvancedXInsertResponse;
					remove?: ApiXDeleteResponse;
				}>({ '$/tools/do': actions }, { labelAs: `grid.save.${slice}` })
				.pipe(
					map(({ update, insert, remove }) => {
						const d = this._dirty.getValue(),
							insKeys = Object.keys(insert?.keys || {}).map(
								(id) => +id
							),
							needsRefresh =
								insKeys?.length || remove?.keys?.length,
							addingData = this.addingData;

						if (remove?.keys?.length) {
							remove.keys.forEach((k) => {
								toBeRemoved.delete(k);
								d.delete(k);
							});
							this._delete.next(toBeRemoved);
						}

						// remove our inserted rows from the dirty store
						insKeys.forEach((oldId) => {
							const addIdx = addingData.findIndex(
								(r) => r[pk] === oldId
							);
							d.delete(oldId);
							if (addIdx > -1) {
								addingData.splice(addIdx, 1);
							}
						});

						Array.from(d.entries()).forEach(([key, row]) => {
							const u = (update?.granted || {})[key];
							if (u) {
								// strip the matching fields from our dirty store
								Object.keys(row)
									.filter((k) => u.hasOwnProperty(k))
									.forEach((k) => delete row[k]);
							}
							// strip anything thats empty out
							if (!Object.keys(row)?.length) {
								d.delete(key);
							}
						});

						this._dirty.next(d);
						console.log(
							'dirty',
							{ d, add: this.addingData },
							'returns',
							!d.size
						);
						this.saving.next(false);
						if (
							!this._comp.widthChanged ||
							!this._comp.orderChanged ||
							!this._comp.isColumnSorted
						) {
							return [!d.size, needsRefresh];
						}
					})
				);
		}
		if (
			this._comp.widthChanged ||
			this._comp.orderChanged ||
			this._comp.isColumnSorted
		) {
			return this.saveLayoutChanges();
		}

		// let test = {'Presentation':{'fields':{"TEXTMultiLine": {"reportLabel": "Details Final"}}}};
		if (this._comp.columnRelabled) {
			this.saving.next(true);
			let dataNew = {
				table: this._comp.slice.source_table
			};

			return this._comp._slices._saveColumnMod(this._comp.slice).pipe(
				map((s) => {
					this.saving.next(false);
					return [true, true];
				})
			);
		}
	}
	saveLayoutChanges() {
		this.saving.next(true);
		if (this._comp.orderChanged) {
			for (let i = 0; i < this._comp.columnOrderArray.length; i++) {
				let Column = this._comp.columnOrderArray[i].colId;
				this._comp.slice.meta.presentation.fields[Column].grid[
					'columnOrder'
				] = i;
			}
		}
		const saveReqObj = {
			id: this._comp.slice.id,
			meta: this._comp.slice.meta,
			parent: this._comp.slice.parent
		};
		return this._comp._slices.saveUpdatedWidth(saveReqObj).pipe(
			map((s) => {
				this.saving.next(false);
				return [true, true];
			})
		);
	}

	private _getDirtyRows() {
		const idField = this._comp.slice?.idField || 'id';
		return Array.from(this._dirty.getValue().entries()).map(([id, row]) =>
			Object.assign({}, row, { [idField]: id })
		);
	}

	private _extractFilterExpression(
		field: string,
		model: AgGridFilterModelSingle,
		fieldsInQuery: { [name: string]: any }
	) {
		const lib = expressionExpander[model.filterType],
			func = lib ? lib[model.type] : null,
			re = new RegExp(`^_${field}_`), // also include any hitched fields that are on the same one
			keys = Object.keys(fieldsInQuery).filter(
				(key) => key === field || re.test(key)
			);
		if (func) {
			if (keys.length > 1) {
				return ['$or', ...keys.map((k) => func(k, model))];
			} else {
				return keys.map((k) => func(k, model))[0];
			}
		} else {
			console.warn(
				'expression expander not found!',
				model.filterType,
				model.type
			);
		}
	}

	private _applyFilterToRequest(
		filterModel: AgGridFilterModel,
		request: SliceQueryParams
	) {
		// makeValueFormatterKey
		const where = [
			'$and',
			...Object.entries(filterModel).map(([id, val]) => {
				const w: any[] = [];
				if ('operator' in val) {
					w.push(
						val.operator === 'OR' ? '$or' : '$and',
						this._extractFilterExpression(
							id,
							val.condition1,
							request.fields
						).forEach((expr) => w.push(expr)),
						this._extractFilterExpression(
							id,
							val.condition2,
							request.fields
						).forEach((expr) => w.push(expr))
					);
				} else {
					this._extractFilterExpression(
						id,
						val,
						request.fields
					).forEach((expr) => w.push(expr));
				}
				return w;
			})
		];
		console.log('applyfilter', where);
		if (where && where.length > 1) {
			if (!request.where) {
				request.where = where;
			} else {
				request.where = ['$and', request.where, where];
			}
			console.log('request mutated: where', request.where);
		}
	}

	getChildCount(data: any) {
		return 0;
	}

	getRows<T>(p: any) {
		if (p && p) {
			this._comp.loading.next(true);
			let comp = this._comp,
				filterModel: AgGridFilterModel =
					p.filterModel && Object.keys(p.filterModel).length
						? p.filterModel
						: null,
				search = comp.searchText,
				slice = comp.slice,
				columns = comp.columns,
				req = p,
				//hardcoded the value since grouping is not implemented yet
				grouped = 0,
				autoExpand = comp.autoExpandGroups,
				//hardcoded the value since grouping is not implemented yet
				groupKeyLength = 0,
				rowGroupColsLength = 0,
				isGroupRequest = rowGroupColsLength !== groupKeyLength,
				childCountKey = comp.childCountKey,
				query = Object.assign({}, comp.query), // works on a clone
				order: any[] = [],
				request: any = Object.assign({}, query, {
					limit: {
						// start: p.request.startRow,
						// end:p.request.endRow
						start: p.startRow,
						end: p.endRow
					},
					return: {
						rows: true,
						count: true
					}
				});
			let sliceWhere = slice?.query_params?.where;

			if (typeof sliceWhere === 'string') {
				sliceWhere = { $excel: sliceWhere };
			}

			if (req.sortModel) {
				req.sortModel.forEach((r: { colId: string; sort: string }) => {
					if (
						slice.meta &&
						slice.meta.presentation &&
						slice.meta.presentation.grid.order
					) {
						let colName =
							slice.meta.presentation.grid.order[0][1][1];
						let sortOrder =
							slice.meta.presentation.grid.order[0][0];
						const key =
								EmbedQueryGridComponent.makeValueFormatterKey(
									colName
								),
							method = sortOrder;
						if (query.fields && query.fields[key]) {
							order.push([method, [query.fields[key]]]);
						} else {
							order.push([method, ['$field', colName]]);
						}
					} else {
						order.push(['$' + r.sort, ['$field', r.colId]]);
					}
				});
				request.order = order;

				// req.sortModel.forEach((r: { colId: string; sort: string }) => {
				// 	const key = EmbedQueryGridComponent.makeValueFormatterKey(r.colId),
				// 		method = r.sort === 'asc' ? '$asc' : '$desc';
				// 	if (query.fields && query.fields[key]) {
				// 		order.push([method, [query.fields[key]]]);
				// 	} else {
				// 		order.push([method, ['$field', r.colId]]);
				// 	}
				// });
			}

			/** remove any column flagged as 'hide' from the query.fields object */
			console.warn(
				'note, fields marked as hidden are manually being stripped from the query.fields'
			);
			// columns
			// 	.filter(
			// 		(col) =>
			// 			col.hide && !col.rowGroupIndex && col.rowGroupIndex !== 0
			// 	)
			// 	.forEach((col) => {
			// 		delete query.fields[col.field];
			// 	});

			// finally, add our searchFields if a search was provided
			if (comp.searchText) {
				searchFields(request, [comp.searchText]);
			}

			// we have a standard request, (no grouping)
			//
			// if (req.rowGroupCols && req.groupKeys.length) {
			// DO we have grouping?
			grouped = 0;

			if (grouped) {
				if (autoExpand) {
					console.warn(
						`automatic group expansion is currently disabled`
					);
				}
				/**
				 * this block builds the where clause
				 */
				const where: any[] = ['$and'];
				//commented the code since grouping is not implemented yet

				// req.rowGroupCols.forEach((col, i) => {
				// 	const v = req.groupKeys[i];
				// 	if (groupKeyLength >= i + 1) {
				// 		// const v = req.groupKeys[i];
				// 		if (v === '') {
				// 			where.push([
				// 				'$eq',
				// 				['$coalesce', ['$field', col.field], ''],
				// 				''
				// 			]);
				// 		} else {
				// 			where.push(['$eq', ['$field', col.field], v]);
				// 		}
				// 	}
				// });

				if (where.length > 1) {
					if (request.where) {
						request.where = ['$and', request.where, where];
					} else {
						request.where = where;
					}
				}

				/**
				 * now, adjust the request if this was a simple group request
				 */
				if (isGroupRequest) {
					const fieldsBefore = Object.assign({}, request.fields);
					request.group = [];
					request.fields = {}; // we need to maintain this for now
					//commented the code since grouping is not implemented yet
					// for (let i = 0; i < groupKeyLength + 1; ++i) {
					// 	const col = req.rowGroupCols[i];

					// 	// perform the count on the bound field (not the possible expression)
					// 	request.fields[childCountKey] = [
					// 		'$count',
					// 		['$field', col.id]
					// 	];

					// 	// make sure our formula is safe (if possible)
					// 	request.fields[col.field] = [
					// 		'$coalesce',
					// 		fieldsBefore[col.field],
					// 		''
					// 	];

					// 	// now, add the bound field/expression to the grouping
					// 	request.group.push(['$field', col.field]);

					// 	// ensure the raw field is included in the payload
					// 	if (!(col.id in request.fields)) {
					// 		request.fields[col.id] = col.id;
					// 		request.group.push(['$field', col.id]);
					// 	}
					// }
				}

				if (
					(!request.group || !request.group.length) &&
					(!request.fields['*'] || !request.fields[slice.idField])
				) {
					request.fields[slice.idField] = slice.idField;
					console.log(
						`automatically added in the the "${slice.idField}" source_pcol field`
					);
				}
			} else {
				if (!request.fields[slice.idField]) {
					request.fields[slice.idField] = slice.idField;
				}
			}

			if (!req.startRow) {
				comp.totalCount.next(null);
			}

			if (filterModel) {
				this._applyFilterToRequest(filterModel, request);
			}

			if (sliceWhere && sliceWhere.length) {
				if (request.where) {
					request.where = ['$and', sliceWhere, request.where];
				} else {
					request.where = sliceWhere;
				}
			}

			// lets do some last minute corrective actions on the request
			mixCustomFieldsIntoApiQuery(request);
			request.where =
				this._comp.parameterName && this._comp.parameterName.related
					? this._comp.parameterName.qry
					: [];

			this._api
				.reportWithPerms<T>(
					this._comp.forceSliceId || slice.id || slice.parent,
					request
				)
				.pipe(takeWhile(() => !comp.destroyed))
				.subscribe((resp) => {
					this._comp.loading.next(false);

					if (resp.rows) {
						// if there is a postQueryTransformFn defined, we need to pass it through
						// and resolve differently
						// console.log(resp.rows);

						// if (req.rowGroupCols && req.rowGroupCols.length > 0) {
						// 	let grouped_data = _map(
						// 		groupBy(resp.rows, req.rowGroupCols[0].field)
						// 	);
						// 	console.log(grouped_data);
						// }
						if (this._comp.postQueryTransformFn) {
							console.log(
								'postQueryTransformFn was passed, performing a client side filter...'
							);

							const adjusted = this._comp.postQueryTransformFn(
								resp.rows || []
							);
							const adjustedCount = adjusted?.length || 0;

							comp.totalCount.next(adjustedCount);
							p.successCallback(adjusted, adjustedCount);
							if (!adjustedCount) {
								comp.showNoRecordsFound();
							} else {
								comp.grid.api.hideOverlay();
							}

							// otherwise, just handles as usual
						} else {
							comp.totalCount.next(resp.count);
							p.successCallback(resp.rows, resp.count);
							if (!resp.count) {
								comp.showNoRecordsFound();
							} else {
								comp.grid.api.hideOverlay();
							}
						}
					} else {
						p.failCallback();
					}
				});
		}
	}
}

/**
 * the component itself
 */
@Component({
	selector: 'app-embed-query-grid',
	templateUrl: './embed-query-grid.component.html',
	styleUrls: ['./embed-query-grid.component.scss']
})
export class EmbedQueryGridComponent<T = any> implements OnInit, OnDestroy {
	@Input() sliceId: any;
	@Input() parameterName: any;
	@Input() parameterValue: number;
	@Input() metaData: any;

	private static _DELETE_ROW_ID = '_delete-column';
	static ADD_ID = 0; // decrement
	static columnFilters = DEFAULT_COLUMN_FILTERS;
	static MIN_ADD_ROWS = 3;
	headerHeight = 30;
	columnApi: any;
	imageCheck: any;
	hiddenColumns: any;
	@Input() args: AgGridComponentData;
	gridOptions: any;
	loading = new BehaviorSubject<boolean>(false);
	rowModelType = 'infinite';
	uniqueRecordsWithID = [];
	duplicateRecordsWithID = [];
	positive_array = [];
	showSearchText = false;
	searchText = null;
	selectedEntity = [];
	allSelectedEnities = [];
	intervalRefresh = null;
	public editType = '';

	@Input() set slice(slice: Slice) {
		const alreadyHas = !!this._slice,
			oldId = this._slice?.id,
			oldWhere = JSON.stringify(this._slice?.query_params?.where || null),
			oldParent = this._slice?.parent,
			gapi = this.grid?.api;

		this._slice = slice;

		if (slice) {
			// if (this.datasource) {
			// 	// gapi.purge
			// }
			console.log('slice changed', slice);

			this._initFromSlice(slice);

			if (alreadyHas && gapi) {
				gapi.setColumnDefs([]); // flush
				gapi.setColumnDefs(this.columns);

				// we need to purge the cache, depending on the circumstances
				if (
					slice.id !== oldId || // new slice
					(!slice.id && slice.parent !== oldParent) || // new parent slice
					JSON.stringify(slice.query_params?.where || null) !==
						oldWhere // our where param changed
				) {
					this.refresh(true);
				}
			}
		}
	}
	get slice() {
		return this._slice;
	}

	private _previewSlice = new BehaviorSubject<Slice>(null);
	types = null;

	@Input() set previewSlice(previewSlice: SliceRow) {
		const par = previewSlice.parent;

		if (!par) {
			console.warn('preview grid MUST have a parent defined');
			throw 'no_parent_slice';
		}
		this._slices
			.fetchSimulated(par, {}, previewSlice)
			.pipe(takeWhile(() => !this.destroyed))
			.subscribe((slice) => this._previewSlice.next(slice));
	}

	set showFilter(show) {
		this._showFilter = show;
		this.grid.api.setFloatingFiltersHeight(show ? null : 0);
		/**
		 * this doesn't work...
		 */
		// this.grid.floatingFilter = show;
		// this.grid.gridOptions.floatingFilter = show;
		// this.grid.api.refreshHeader();
	}
	get showFilter() {
		return !!this._showFilter;
	}

	onKeyUp() {
		this.searchSubject.next(this.searchText);
	}

	get searchValue() {
		return searchStringToArray(this.search.value);
	}

	// override for the datasource.getRows target slice
	@Input() forceSliceId: number | string;

	@Input() postQueryTransformFn!: postQueryTransformFn;

	constructor(
		public app: AppService,
		public _slices: SliceService,
		private _route: ActivatedRoute,
		private _cd: ChangeDetectorRef,
		private _api: ApiService,
		private _elem: ElementRef,
		@Inject(DOCUMENT) private _doc: Document,
		private _cfr: ComponentFactoryResolver,
		private _injector: Injector,
		private _appRef: ApplicationRef,
		private _routing: RoutingService,
		private _actions: ActionsService,
		private _control: ControlService,
		private overlay: Overlay,
		private viewContainerRef: ViewContainerRef,
		private _dialog: MatDialog,
		private router: Router,
		private dialogService: HeaderDialogService,
		private socketService: SocketService
	) {}

	private _onAddGridInitEdit: StartEditingCellParams;
	adding = false;
	@ViewChild('addContainerNode', { read: ElementRef, static: false })
	addContainerNode: ElementRef<HTMLElement>;
	@ViewChild('addHeaderBar', { read: ElementRef, static: false })
	addHeaderBar: ElementRef<HTMLElement>;
	@ViewChild('addGrid', { read: AgGridAngular }) addGrid: AgGridAngular;
	set addFullViewport(full: boolean) {
		const addGrid = this.addGrid,
			gApi = addGrid?.api;

		this._addFullViewport = full;

		if (full) {
			gApi.setHeaderHeight(this.headerHeight);
		} else {
			gApi.setHeaderHeight(0);
			this._minimizeAdd();
		}
	}
	get addFullViewport() {
		return this._addFullViewport;
	}
	private _addFullViewport = false;

	autoExpandGroups = false;
	childCountKey = '_childCount';
	columns: ColDef[];

	outsideClick$: Subscription;
	overlayRef: any;

	@ViewChild('overlayRelatedAdd', { read: TemplateRef, static: false })
	overlayRelatedAdd: TemplateRef<any>;

	components = {
		actionIcon: ActionIconComponent,
		dateTime: DateTimeComponent,
		html: HtmlRendererComponent,
		routedIcon: RoutedIconComponent,
		routedLink: RoutedLinkComponent,
		notificationLink: NotificationLinkComponent,
		iconValue: IconValueComponent,
		fileArray: FileArrayComponent,
		yesOrNo: YesOrNoComponent
	};
	datasource: Datasource;

	public agCustomComponents: {
		[p: string]: any;
	} = {
		agColumnHeader: HeaderComponent
	};
	noRowsTemplate = 'No Rows To Show';
	defaultColumn: ColDef = {
		sortable: true,
		minWidth: 32,
		maxWidth: 1920,
		resizable: true,
		// suppressMenu: true,
		menuTabs: ['generalMenuTab']
		// enableRowGroup: true,
	};
	public rowGroupPanelShow = 'false';

	description?: string;
	destroyed = false;
	disable: DisableFeatures = {};
	relations = [];
	isAdmin = false;
	errors = new Set<string>();
	@ViewChild('grid', { read: AgGridAngular }) grid: AgGridAngular;
	groupKey = '_groupId';
	grouping: string[] = [];
	meta: Metadata;
	namedSlice?: string;
	noReportError = ERRORS.NO_REPORT_PERMISSIONS;
	query: {
		fields: { [key: number]: any };
		where?: WhereExpression;
	} = {
		fields: {}
	};
	@Input() serialized: GridSerialized;
	search = new FormControl();
	@ViewChild('searchInput', { read: ElementRef })
	searchInput: ElementRef<HTMLInputElement>;
	showRowNumbers: boolean;
	@Output() totalCount = new Subject<number>();
	title: string;
	titleTranslate = false;
	icon: string;
	iconTranslate = false;
	iconColor?: ThemePalette = 'primary';
	readonly = false;
	notNotification = true;
	forceColumnsFromQueryParams = false;
	columnPicker = false;
	sideBar: SideBarDef | boolean = false;
	public cacheBlockSize = 500;
	public cacheOverflowSize = 1;
	public maxConcurrentDatasourceRequests = 1;
	public infiniteInitialRowCount = 1;
	public maxBlocksInCache = 20;
	rowBuffer = 20;

	ready = false;
	newMetaRootData: any;

	private _resizeColumnsAfterInitialFetch = false;

	private _showFilter = false;
	private _subscriptions = new Map<string, Subscription>();

	private searchSubject: Subject<string> = new Subject();
	private _slice: Slice;
	rowData: any;
	metaNew: any;
	metaRoot: any;
	columnChanged: boolean = false;
	widthChanged: boolean = false;
	orderChanged: boolean = false;
	columnRelabled: boolean = false;
	rowStyleParams: any;
	duplicatesArr = [];
	uniqueArr = [];
	public rowSelection = 'multiple';
	rowHeight = 26;
	columnOrderArray = [];
	isColumnSorted: boolean = false;

	public getRowId: GetRowIdFunc = (params: GetRowIdParams) => {
		return params.data.id;
	};
	static makeValueFormatterKey(key: string) {
		return `_${key}_vf`;
	}

	autoFocusSearch() {
		setTimeout(() => {
			this._doc.getElementById('searchTextId').focus();
		}, 100);
	}

	save() {
		this.datasource.save().subscribe(([allGood, requiresRefresh]) => {
			const adding = this.datasource.addingData;
			if (allGood) {
				this.app.notify.success('record_added');
				this.widthChanged = false;
				this.columnRelabled = false;
				this.orderChanged = false;
				this.isColumnSorted = false;
			} else {
				this.app.notify.warn('some_changes_werent_saved');
			}
			if (requiresRefresh) {
				this.addGrid?.api?.setRowData(adding);
				if (this.datasource?.addingData?.length < 2) {
					this.adding = false;
					this._cd.detectChanges();
				}
				this.refresh();
				this.refreshCache();
				this.refreshData();
			}
		});
	}

	// getRowHeight(v?: any): number {
	// 	// fontsize * 2 + padding-top + padding-right | 15 * 2 + 4 + 4 = 38
	// 	return 30;
	// }
	getRowHeight(params: RowHeightParams) {
		// return 30;
		//  params.node.rowHeight = 30;
		//  this.gridOptions.api.resetRowHeights();
	}

	private _minimizeAdd() {
		const rowHeight = 30,
			node = this.addContainerNode.nativeElement,
			toolbarHeight = this.addHeaderBar.nativeElement?.offsetHeight || 0;
		node.style.height = `${
			rowHeight * EmbedQueryGridComponent.MIN_ADD_ROWS + toolbarHeight + 2
		}px`;
	}

	showNoRecordsFound() {
		console.log('show no records');
		this.grid.api.showNoRowsOverlay();
	}

	editReport() {
		this.router.navigate([
			this._routing.editReportView(this._slice.parent, this._slice.id)
		]);
	}

	print() {
		const gridApi = this.grid.api,
			host = this._elem.nativeElement;
		gridApi.setDomLayout('print');
		host.classList.add('printing');
		setTimeout(() => {
			print();
			host.classList.remove('printing');
			gridApi.setDomLayout(null);
		}, 500);
	}

	ngOnDestroy() {
		this.destroyed = true;
		clearInterval(this.intervalRefresh);
	}

	ngOnInit() {
		this.searchSubject
			.pipe(
				takeWhile(() => !this.destroyed),
				searchStringToArrayPipe(500)
			)
			.subscribe((search) => {
				const key = this._cacheKey('search');
				if (search) {
					localStorage.setItem(key, search.join(' '));
				} else {
					localStorage.removeItem(key);
				}
				this.refresh();
			});

		if (location.href.indexOf('grid/notifications') > -1) {
			this.notNotification = false;
		}
		// listen to changes to our auth/params/data and adjust the slice
		combineLatest([
			this.app.auth,
			this._route.paramMap,
			this._route.data,
			this._previewSlice
		]).subscribe((slice) => {
			this._api
				.request({
					'$/tools/action_chain': [
						{
							'!/slice/report': {
								slice:
									this.sliceId || this.parameterName?.slice,
								where: this.parameterName
									? this.parameterName.qry
									: [],
								fields: { '*': '*' },
								return: { types: 1 }
							}
						}
					]
				})
				.subscribe((re) => {
					this.types = re;
					this._slices
						.fetch(this.sliceId || this.parameterName?.slice, {
							includeRootMeta: true
						})
						.subscribe((y) => {
							this.slice = y;
						});
				});
		});

		this.app.languageChanged
			.pipe(takeWhile(() => !this.destroyed))
			.subscribe(() => {
				let hasValueTranslated = false;
				const ser = this.serialized;
				if (ser) {
					const should = ser.labelTranslate,
						app = this.app,
						gridApi = this.grid.api,
						translated = Object.entries(ser.columns).filter(
							([k, c]) => {
								const def = gridApi.getColumnDef(k);
								if (c.valueTranslate) {
									hasValueTranslated = true;
								}
								if (c.hasOwnProperty('label')) {
									if (c.label !== false) {
										if (c.labelTranslate || should) {
											def.headerName =
												app.translate(c.label) || '';
										} else {
											def.headerName = c.label || '';
										}
									} else {
										def.headerName = '';
									}
								} else if (def.field) {
									def.headerName = def.field;
								}
							}
						);

					if (translated.length) {
						gridApi.refreshHeader();
					}
					if (hasValueTranslated) {
						this.refresh();
					}
				}
			});
	}
	findAndReplace(column: any) {
		const httpOrHttpsVerb = environment.production ? 'https://' : 'http://';
		const modulesText = environment.production ? '/modules' : '';
		const url =
			httpOrHttpsVerb +
			window.location.host +
			modulesText +
			'/tools/find/' +
			this.slice.parent +
			'/' +
			column +
			'?' +
			`hideui=true&where=%7B%7D&userparams=%7B%7D&slice=${this.slice.id}&selected=%5B%5D&userparams=%7B%7D`;
		this.getAllRows();
		const dialogRef = this._dialog.open(FindAndReplaceAngularComponent, {
			data: {
				slice: this.slice.id,
				column,
				rows: this.getAllRows(),
				url: url
			},
			disableClose: true
		});

		dialogRef
			.afterClosed()
			.pipe(
				takeWhile(() => !this.destroyed),
				take(1)
			)
			.subscribe((resp) => {
				this.refresh();
				// this.grid.api.setRowData(resp.data);
				// this.grid.api.setServerSideDatasource(resp.data);
			});

		dialogRef.componentInstance.onSave.subscribe((data) => {
			this.refresh();
		});
	}
	getChildCount(data: any) {
		return data ? data[this.childCountKey] || 0 : 0;
	}

	// nGridSizeChanged(ev: GridSizeChangedEvent) {
	// 	return ev.api.sizeColumnsToFit();
	// }

	getRowNodeId(row: any) {
		const f = this.slice.idField,
			key = this.groupKey;
		return row[f]
			? '' + row[f]
			: row[key] || (row[key] = JSON.stringify(row));
	}

	onGridReady(params: GridReadyEvent) {
		console.log('ready');
		this.showFilter = false;
		this.columnApi = params.columnApi;
		this._attachDatasource(params.api);
		params.api.setDatasource(this._createDatasource());
	}

	private _destroyDatasource() {
		this.grid?.api?.setServerSideDatasource(null);
		this.datasource = null;
	}

	private _createDatasource() {
		return (this.datasource = new Datasource(this, this._api));
	}

	private _attachDatasource(gapi: GridApi) {
		gapi.setServerSideDatasource(
			this.datasource || this._createDatasource()
		);
	}

	onGridFirstDataRendered(evt: FirstDataRenderedEvent) {
		if (this._resizeColumnsAfterInitialFetch) {
			console.warn('autosize the columns');
		}
	}

	refresh(hard?: boolean) {
		if (hard) {
			this._destroyDatasource();
			this._attachDatasource(this.grid.api);
		} else {
			this.grid.api.purgeServerSideCache([]);
			this.refreshCache();
		}
	}

	/**
	 * this hack keeps the row heights in sync when editing is finished, in the event
	 * that a custom editor needs to adjust the row height, as 'dynamic' heights aren't
	 * supported with serverside store...
	 */

	// tslint:disable-next-line: member-ordering
	private _editingHeights = new Map<RowNode, number>();

	// when the editor gets focus, we want to track it locally, so, cache it
	cellEditingStarted(evt: CellEditingStartedEvent) {
		this._editingHeights.set(evt.node, evt.node.rowHeight);
	}
	focusOut(evt: CellEditingStoppedEvent) {
		// console.log(evt);
	}

	// editing has stopped, make any needed adjustments
	cellEditingStopped(evt: CellEditingStoppedEvent) {
		const eh = this._editingHeights,
			val = eh.get(evt.node);
		if (val) {
			// check to see if the rowheight has changed
			// note - this MAY cause issues when multiple editors in play
			if (val !== evt.node.rowHeight) {
				evt.node.setRowHeight(val);
			}
			eh.delete(evt.node);
		}
	}

	cellValueChanged(evt: CellValueChangedEvent) {
		console.log(evt, 'CellValueChangedEvent');

		const f = evt.colDef.field;
		if (f) {
			if (evt.oldValue !== evt.newValue) {
				console.log('cellValueChanged', { f, evt, data: evt.data });
				const newlyCreated = this.datasource.cellChanged(f, evt.data);
				if (evt.api === this.addGrid?.api && newlyCreated) {
					// force the creation of a new row
					this._addNewRow(true);
				}
			} else if (evt.oldValue != evt.value) {
				console.log('cellValueChanged', { f, evt, data: evt.data });
				const newlyCreated = this.datasource.cellChanged(f, evt.data);
				if (evt.api === this.addGrid?.api && newlyCreated) {
					// force the creation of a new row
					this._addNewRow(true);
				}
			}
		} else {
			console.warn('change', evt);
		}
	}

	onAddGridReady(evt: GridReadyEvent) {
		const api = evt.api;

		// spin up with our defaults..
		api.setRowData(this.datasource.addingData);

		// force the sort into the new ID, descending, to preserve our order
		// Deprecated
		// api.setSortModel([{ colId: this.datasource.idColumn, sort: "desc" }]);
		// evt.columnApi.applyColumnState({
		// 	state: [{ colId: this.datasource.idColumn, sort: 'desc' }]
		// });

		evt.columnApi.setColumnVisible(
			EmbedQueryGridComponent._DELETE_ROW_ID,
			true
		); // ensure our 'delete' is up

		if (!this.datasource.addingData?.length) {
			this._addNewRow();
		}

		if (this._onAddGridInitEdit) {
			console.log('found', this._onAddGridInitEdit);
			api.startEditingCell(this._onAddGridInitEdit);
		}
	}
	getAllRows() {
		let rowData = [];
		this.grid.api.forEachNode((node) => rowData.push(node.data));
		return rowData;
	}

	addRow() {
		let url = this.router
			.createUrlTree([
				this._routing.formAddRecord(
					this._slice.id,
					this._slices.getDefaultFormIdFromSliceDetail(this._slice)
						? this._slices.getDefaultFormIdFromSliceDetail(
								this._slice
						  )
						: '1'
				)
			])
			.toString();

		const parentItem = {};
		if (this.parameterName) {
			parentItem[this.parameterName.left] = this.parameterValue;
		}
		this.router.navigate([url], {
			state: {
				data: {
					emId: this.parameterValue,
					parentItem: parentItem,
					refUrl: this.router.url
				}
			}
		});
	}

	private _addNewRow(forceCreate?: boolean) {
		const add = this.datasource.addingData;
		if (forceCreate || !add.length) {
			const newRow = this._createwNewRow();
			this.addGrid.api.updateRowData({
				add: [newRow],
				addIndex: add?.length
			});
			this.datasource.addingData.push(newRow);
		}
	}

	private _createwNewRow() {
		const id = --EmbedQueryGridComponent.ADD_ID,
			slice = this.slice,
			idField = this.datasource.idColumn,
			row: object & PermBits = {
				[idField]: id,
				_deletable: true,
				_updatable: new Set(slice.perms.insert) // copy the 'insert' perms keys into updateable
			};
		return row;
	}

	private _cacheKey(key: string) {
		return `${this.slice.id}-grid-${key}`;
	}

	private _initFromSlice(slice: Slice) {
		this._build(slice);
		this._cd.detectChanges();
	}

	private _serializedColumnToCol(
		id: string,
		col: SerializedColDef,
		ser: GridSerialized
	): ColDef {
		const def: ColDef = {
				colId: id,
				cellEditorParams: {}
			},
			components = this.components,
			translate = TranslatePipe.instance,
			translateLabel =
				'labelTranslate' in col
					? !!col.labelTranslate
					: ser.labelTranslate; // if the col was hard coded, use its value, otherwise fallback on the default provided

		def.hide = !!col.hide;

		// go through a simple whitelist of properties that are simple copy as is
		[
			'flex',
			'width',
			'minWidth',
			'maxWidth',
			'sort',
			'sortedAt',
			'pinned',
			'lockPosition',
			'lockPinned'
		].forEach((prop) => {
			if (col.hasOwnProperty(prop)) {
				def[prop] = col[prop];
			}
		});

		if (typeof col?.getValue === 'function') {
			def.valueGetter = (params) => {
				return col.getValue(params.data);
			};
		}

		if (typeof col?.setValue === 'function') {
			def.valueSetter = (params) => {
				return col.setValue(params.newValue, params.data);
			};
		}

		if (col.valueFormatter) {
			const formulaKey =
				EmbedQueryGridComponent.makeValueFormatterKey(id);
			def.field = formulaKey;
			this.query.fields[formulaKey] = col.valueFormatter;
		} else {
			this.query.fields[id] = id;
		}

		if (col.valueTranslate) {
			def.valueFormatter = (p: ValueFormatterParams) =>
				typeof p.value === 'string'
					? translate.transform(p.value, p.data)
					: '';
		}

		if (col.label || col.label === false) {
			def.headerName = col.label || '';
		}

		if (col.rendererParams) {
			Object.assign(
				def.cellRendererParams || (def.cellRendererParams = {}),
				col.rendererParams
			);
		}

		if (translateLabel && def.headerName) {
			def.headerName = translate.transform(def.headerName);
		}

		if (col.editor) {
			const e = controls.get(col.editor as EDITOR);
			if (e) {
				def.cellEditorFramework = e;
			} else {
				console.warn('unable to find the editor', { col });
			}

			if (col.editorParams) {
				Object.assign(def.cellEditorParams, col.editorParams);
			}
		}

		if (col.renderer) {
			if (col.renderer in components) {
				def.cellRendererFramework = components[col.renderer];
			} else {
				const r = controls.get(col.renderer as EDITOR);
				if (r) {
					def.cellRendererFramework = r;
				} else {
					console.warn(`"${col.renderer}" renderer not found`, {
						def
					});
				}
			}
		}

		if (col.align) {
			def.cellClass = def.headerClass = `column-align-${col.align}`;
		}

		return def;
	}

	private _deserialize(serialized: GridSerialized = {}) {
		const defs = this.columns,
			columns = serialized.columns || {},
			slice = this.slice;

		// mix anything defined in the column into the generated Column
		Object.entries(columns).forEach(([colId, col]) => {
			const match = defs.find((d) => d.colId === colId),
				def = this._serializedColumnToCol(colId, col, serialized);
			if (match) {
				Object.assign(match, def);
			} else {
				// if there isnt a field, or a valueGetter, try to map it to the id
				if (def.field) {
					def.field = def.field;
				} else {
					if (!def.field) {
						if (colId) {
							def.field = colId;
						} else {
							def.field = slice.idField;
						}
					}
				}
				defs.push(def);
			}
			// shim in any weird properties from our custom format (renderParams, etc..) to the column def
			// this._mixSerializedColDefs(match || def, col);
		});

		// set the column ordering if its present
		(serialized.columnOrder || []) // work backwords, and shift the matches to the start of the array
			.reverse()
			.forEach((colId) => {
				const match = defs.findIndex((def) => def.colId === colId);
				if (match > -1) {
					defs.unshift(defs.splice(match, 1)[0]);
				}
			});

		// if any FID exists, that do NOT have column representation in the serialized
		// version, should be removed from the query.fields, and, pulled from the column
		Object.entries(slice.fids).forEach(([id, fid]) => {
			const col = fid.col,
				match = columns[col],
				def = defs.find((d) => d.colId === col || d.colId === `${id}`);
			// if (fid.renderHint == 'datetime') {
			// 	console.log(def, col, fid);
			// 	this._decorateColumnDateTime(col, def);
			// }

			if (!match && def) {
				def.hide = true;
			}
		});

		if (serialized.disable) {
			this.disable = serialized.disable;
		}

		// the title and what not
		// const title = this.title =
		const rawTitle = serialized.title || slice.name,
			title = (this.title = !!serialized.titleTranslate
				? TranslatePipe.instance.transform(rawTitle)
				: rawTitle);

		if (this.args?.routed) {
			this.app.title.setTitle([title]);
		}

		// rando serialized properties
		this.icon = serialized.icon;
		this.iconTranslate = !!serialized.iconTranslate;
		this.iconColor = serialized.iconColor || this.iconColor;
		this.autoExpandGroups = !!serialized.autoExpandGroups;
		this.showRowNumbers = !!serialized.showRowNumbers;
		this.readonly = !!serialized.readonly;
		this.forceColumnsFromQueryParams =
			!!serialized.forceColumnsFromQueryParams;

		if (this.forceColumnsFromQueryParams) {
			const qpFids = new Set(
				Object.keys(slice.query_params?.fields || {})
			);
			this.columns.forEach((c) => {
				c.hide = !qpFids.has(c.field);
			});
		}

		// creating this for special case of notification log report
		if (this.slice.name == 'Notifications') {
			// creating a dummy array at first to swap the order with original columns Array
			let changedOrderCols = [
				'type',
				'toRef',
				'subject',
				'fromRef',
				'sent',
				'_attachments'
			] as any;
			for (let i = 0; i < this.columns.length; i++) {
				switch (this.columns[i].colId) {
					case 'type':
						changedOrderCols[0] = this.columns[4] as any;
						// styles for first column type
						(changedOrderCols[0].cellStyle = {
							'justify-content': 'center'
						}),
							(changedOrderCols[0].headerClass =
								'notification-first-header');
						break;
					case 'toRef':
						changedOrderCols[1] = this.columns[3] as any;
						changedOrderCols[1].width = 350;
						break;
					case 'subject':
						changedOrderCols[2] = this.columns[1] as any;
						break;
					case 'fromRef':
						changedOrderCols[3] = this.columns[2] as any;
						break;
					case 'sent':
						changedOrderCols[4] = this.columns[0] as any;
						// changing the date format display for sent column
						changedOrderCols[4].cellRendererFramework =
							this.components.dateTime;
						changedOrderCols[4].cellRendererParams = {
							format: 'MMM d, y, h:mm a'
						};
						break;
					case '_attachments':
						changedOrderCols[5] = this.columns[5] as any;
						break;
				}
				if (i == 5) {
					this.columns = changedOrderCols;
				}
			}
		}

		// check to see if we have any 'onOpen'
		serialized.onOpen?.forEach((action) =>
			this._actions.processAction(action)
		);
	}

	private _build(slice: Slice) {
		const serialized: GridSerialized =
				this.serialized ||
				(this.serialized =
					(slice?.meta as any)?.serialized?.grid ||
					this._slices.getSystemSliceMeta(
						this.namedSlice || this.slice.id
					)),
			isLegacy = !(
				slice?.meta?.presentation || slice?.root?.meta?.presentation
			);

		// Temporary stopping if condition as its creating issue when we have dashboard in place
		if (isLegacy) {
			this._buildFromLegacy(slice, serialized);
			if (serialized) {
				this._deserialize(serialized);
			} else {
				this._resizeColumnsAfterInitialFetch = true;
			}
		} else {
			// this._buildFromLegacy(slice, serialized);
			this._buildColumnsFromFids(slice, serialized);
			if (serialized) {
				this._deserialize(serialized);
			} else {
				this._resizeColumnsAfterInitialFetch = true;
			}
		}
		this._addSliceFeatures(serialized);

		this._setGrouping(serialized);

		if (!this.readonly) {
			this._addControlColumns();
		}

		this._afterColumnsCreated();
	}

	private _afterColumnsCreated() {
		this._stretchLastColumn();
		if (!this.readonly) {
			this._attachEditors();
		}
	}

	private _addSliceFeatures(ser: GridSerialized) {
		const s = this._slice,
			forceDisabled = ser?.disable || {};

		// if (!forceDisabled.addRecord) {
		// 	this.disable.addRecord = !s?.perms.insert;
		// }
	}

	private _attachEditors() {
		const columns = this.columns,
			slice = this.slice,
			fids = slice.fids;

		console.log('attach editors', { columns, fids });

		columns
			.filter((col) => !col.cellEditor && !col.cellEditorFramework) // ignore ones that have been muxed in
			.forEach((col) => {
				const fid = slice.fidById(col.field),
					[comp, params] = this._control.componentFromFid(fid);

				if (comp) {
					const base = { slice, fid };
					col.cellEditorFramework = comp;
					if (params) {
						if (col.cellEditorParams) {
							Object.assign(col.cellEditorParams, params, base);
						} else {
							col.cellEditorParams = Object.assign(
								{},
								params,
								base
							);
						}
					} else {
						col.cellEditorParams = Object.assign({}, base);
					}
				}
			});

		// now, attach our 'canEdit' to anything that needs to be
		columns
			.filter((col) => col.cellEditor || col.cellEditorFramework)
			.forEach((col) => {
				col.editable = this._canEditCell.bind(this, col);
			});
	}

	// can the cell be edited?
	private _canEditCell(col: ColDef, ev: IsColumnFuncParams): boolean {
		return (
			ev.data?._updatable?.has(col?.field) &&
			!this.datasource?.isMarkedForDeletion(ev.data)
		);
	}

	private _stretchLastColumn() {
		const cols = this.columns,
			unpinned = cols.filter((col) => !col.pinned),
			hasFlex = cols.some((col) => col.flex);

		// if nothing is stretch, we need to stretch the last one
		// if (!hasFlex && unpinned.length) {
		// 	console.log(cols[unpinned.length - 1]);
		// 	cols[unpinned.length - 1].flex = 1;
		// }
	}
	cellClicked(evt) {
		this.uniqueRecordsWithID = [];
		this.duplicateRecordsWithID = [];
		// this.grid.api.redrawRows();
	}
	cellDoubleClicked(evt: CellDoubleClickedEvent) {
		this.grid.api.startEditingCell({
			rowIndex: evt.rowIndex,
			colKey: evt.column.getColId()
		});
	}
	refreshData() {
		this.grid.api.redrawRows();
	}

	private _addControlColumns() {
		const disable = this.disable || {},
			iconWidthExtra = 0,
			width = RoutedIconComponent.width + iconWidthExtra, // width + padding + border gutter
			cellClass = 'icon-cell',
			columns = this.columns,
			slice = this.slice,
			trans = TranslatePipe.instance,
			baseDef: ColDef = {
				resizable: false,
				width,
				minWidth: width,
				maxWidth: 30,
				pinned: 'left',
				lockVisible: true,
				lockPinned: true,
				lockPosition: 'left',
				cellClass: 'locked-col',
				suppressMovable: true,
				cellRendererFramework: this.components.routedIcon
			};

		if (!disable.viewRecord) {
			columns.push(
				Object.assign({}, baseDef, {
					menuTabs: [],
					cellRendererParams: {
						icon: 'icon_view_record',
						color: '#3F6F85',
						pinned: 'left',
						lockPinned: true,
						tooltip: trans.transform('view_record', slice),
						url: this.makeViewUrl.bind(this)
					},
					valueGetter: this.canViewRow.bind(this)
				})
			);
		}

		if (!disable.editRecord) {
			columns.push(
				Object.assign({}, baseDef, {
					pinned: 'left',
					lockPinned: true,
					menuTabs: [],
					cellRendererParams: {
						icon: 'icon_edit_record',
						color: '#3F6F85',
						tooltip: trans.transform('edit_record', slice),
						url: this.makeEditUrl.bind(this)
					},
					valueGetter: this.canEditRow.bind(this)
				})
			);
		}

		if (this.relations.length) {
			columns.push(
				Object.assign({}, baseDef, {
					menuTabs: [],
					cellRendererParams: {
						icon: 'add_circle',
						color: '#3F6F85',
						tooltip:
							this.relations.length === 1
								? 'Add a ' +
								  this.relations[0].fromSliceName +
								  ' record'
								: 'Add a record to a related report',

						click: this.makeRelatedAddUrl.bind(this)
					},
					valueGetter: () => true
				})
			);
		}

		if (this.showRowNumbers) {
			columns.unshift({
				sortable: false,
				headerName: TranslatePipe.instance.transform('#'),
				// pinned: 'left',
				valueGetter: (p) => p.node.rowIndex + 1,
				width: 1,
				cellClass: 'row-number column-align-center'
			});
		}
	}

	canViewRow(p: ValueGetterParams) {
		return true;
	}

	canEditRow(p: ValueGetterParams) {
		const u = p.data && p.data._updatable ? p.data._updatable : false;
		return (u && !!u.size) || false;
	}
	canDeleteRow(p: ValueGetterParams) {
		const d = p?.data || {},
			id = d[this.datasource.idColumn];
		return !!(
			(id > 0 && d?._deletable) ||
			(p.api === this.addGrid?.api && this.datasource.isRowDirty(d))
		);
	}

	makeEditUrl(row: any) {
		if (row) {
			const slice = this._slice;
			return this._routing.formEditRecord(
				slice.id,
				this._slices.getDefaultFormIdFromSliceDetail(slice),
				row[slice.idField]
			);
		}
	}

	makeViewUrl(row: any) {
		if (row) {
			const slice = this._slice;
			return this._routing.formViewRecord(
				slice.id,
				this._slices.getDefaultFormIdFromSliceDetail(slice),
				row[slice.idField]
			);
		}
	}

	private getOverlayConfig({ origin }): OverlayConfig {
		return new OverlayConfig({
			hasBackdrop: true,
			backdropClass: 'popover-backdrop',
			positionStrategy: this.getOverlayPosition(origin),
			scrollStrategy: this.overlay.scrollStrategies.close()
		});
	}

	private getOverlayPosition(origin: any): PositionStrategy {
		const positionStrategy = this.overlay
			.position()
			.flexibleConnectedTo(origin)
			.withPositions(this.getPositions())
			.withPush(false);

		return positionStrategy;
	}

	private getPositions(): ConnectionPositionPair[] {
		return [
			{
				originX: 'start',
				originY: 'bottom',
				overlayX: 'start',
				overlayY: 'top'
			},
			{
				originX: 'start',
				originY: 'bottom',
				overlayX: 'start',
				overlayY: 'top'
			},
			{
				originX: 'start',
				originY: 'bottom',
				overlayX: 'start',
				overlayY: 'top'
			}
		];
	}

	makeRelatedAddUrl(relatedSlice: any, currentContext: any) {
		this.close(null);
		if (this.relations.length > 1) {
			this.overlayRef = this.overlay.create(
				this.getOverlayConfig({
					origin: relatedSlice._elementRef.nativeElement
				})
			);
			this.overlayRef.attach(
				new TemplatePortal(
					this.overlayRelatedAdd,
					this.viewContainerRef
				)
			);

			this.outsideClick$ = fromEvent<MouseEvent>(document, 'click')
				.pipe(
					filter((event) => {
						const clickTarget = event.target as HTMLElement;
						return (
							clickTarget !=
								relatedSlice._elementRef.nativeElement &&
							!!this.overlayRef &&
							!this.overlayRef.overlayElement.contains(
								clickTarget
							)
						);
					}),
					take(1)
				)
				.subscribe(() => {
					this.close(null);
				});
		} else {
			this.openRelatedSlice(this.relations[0]);
		}
	}

	openRelatedSlice(r) {
		this._slices
			.fetch(r.fromSlice, {
				includeRootMeta: true
			})
			.subscribe((t) => {
				const formId = Object.keys(
					(t.meta?.presentation as JotMetaPresentation)?.forms ||
						(t.meta?.presentation as JotMetaPresentation)?.forms ||
						{}
				)
					.map((key) => +key)
					.pop();
				let url = this.router
					.createUrlTree([
						this._routing.formAddRecord(r.fromSlice, formId)
					])
					.toString();
				this.router.navigateByUrl(
					url + '?returnURL=' + this.router.url
				);
			});
	}

	close(data: any) {
		this.outsideClick$ && this.outsideClick$.unsubscribe();
		if (this.overlayRef) {
			this.overlayRef.dispose();
			this.overlayRef = null;
		}
	}

	getRowClass(evt: any) {
		const row = evt.data as T,
			marked = this.datasource.isMarkedForDeletion(row);
		if (marked && this.selectedEntity.length > 0) {
			return 'marked-for-deletion';
		}
	}

	deleteRowClick(row: T) {
		const [toggled, addRemoved] = this.datasource.toggleDeletion(row),
			id = this.getRowNodeId(row),
			node = this.grid.api.getRowNode(id);

		if (!toggled) {
			this.app.notify.warn('busy', 'x', { duration: 1000 }, true);
		} else if (node) {
			this.grid.api.redrawRows({ rowNodes: [node] });
		}

		// if it was removed from the 'add', kill it from the add grid
		// if (addRemoved) {
		this.addGrid?.api?.applyTransaction({
			remove: [this.addGrid.api.getRowNode(id)]
		});
		// }
		console.log(
			'changed',
			this.datasource.dirty,
			this.datasource.addingData
		);
	}
	onRowClick(event) {
		if (this.rowSelection === 'multiple') {
			this.selectedEntity = this.grid.api.getSelectedRows();
		} else {
			this.selectedEntity = this.grid.api.getSelectedRows()[0];
		}
	}
	deleteRecords() {
		if (this.selectedEntity.length > 0) {
			for (let i = 0; i < this.selectedEntity.length; i++) {
				this.deleteRowClick(this.selectedEntity[i]);
				if (i == this.selectedEntity.length - 1) {
					this.openDeleteDialog();
				}
			}
		} else {
			this.allSelectedEnities = this.getAllRows();
			for (let i = 0; i < this.allSelectedEnities.length; i++) {
				this.deleteRowClick(this.allSelectedEnities[i]);
				if (i == this.allSelectedEnities.length - 1) {
					this.openDeleteDialog();
				}
			}
		}
	}

	openTemplates() {
		// this.slice.parent;
	}

	groupRowInnerRenderer(p: any) {
		// we need to deduce the grouping field on the current level, and use the custom framework thingy
		const node: RowNode = p.node,
			lvl = node.level,
			grouping = this.grouping,
			col = this.columns.find((c) => c.colId === grouping[lvl]);

		if (col && col.cellRendererFramework) {
			setTimeout(() => {
				const target = p.eGridCell.querySelector('.ag-group-value'),
					factory = this._cfr.resolveComponentFactory(
						col.cellRendererFramework
					),
					injNode = this._doc.createElement(
						'app-grid-group-renderer-injected'
					);

				target.appendChild(injNode);
				const ref: any = factory.create(this._injector, [], injNode);
				const inst = ref.instance;
				this._appRef.attachView(ref.hostView);

				// spoof the params...
				inst.agInit.call(
					inst,
					Object.assign(
						{
							value: p.value,
							valueFormatted: p.valueFormatted,
							data: p.data
						},
						col.cellRendererParams || {}
					)
				);

				// console.log({p, lvl, grouping, col, factory, target, ref, node}, ref.instance.agInit)
			});
		} else {
			return p.valueFormatted || p.value;
		}
	}

	private _setGrouping(serialized: GridSerialized = {}) {
		console.warn('grouping temp disabled, need to refactor a bit');
		// const grouping = serialized.group,
		// 	slice = this.slice,
		// 	columns = this.columns;

		// let groupingOrder: string[] = [];
		// if (grouping && grouping.length) {
		// 	groupingOrder = grouping;
		// } else if (slice.query_params && slice.query_params.group && slice.query_params.group.length) {
		// 	groupingOrder = slice.query_params.group.map((g => typeof g[1] === 'string' ? g[1] : g[1][1]));
		// }

		// groupingOrder
		// 	.forEach((field, i) => {
		// 		const match = columns.find(def => def.colId === field);
		// 		if (match) {
		// 			match.rowGroupIndex = i;
		// 			match.hide = true;
		// 			this.grouping.push(field);
		// 			if (!match.valueGetter) {
		// 				match.valueGetter = this._groupedColumnValueGetter.bind(this);
		// 			}
		// 		}
		// 	});
	}

	private _groupedColumnValueGetter(p: ValueGetterParams) {
		const v = p.data[p.colDef.field];
		return v || v === false ? v : '';
	}

	private _buildColumnsFromFids(slice: Slice, ser?: GridSerialized) {
		const cols = (this.columns = []),
			meta = slice?.meta?.presentation as LegacyMetaPresentation,
			rootMeta = (slice?.root?.meta?.presentation ||
				{}) as JotMetaPresentation,
			fields = meta?.fields || rootMeta?.fields || {},
			rootFields = rootMeta.fields || {},
			queryFields = this.query.fields,
			filters = EmbedQueryGridComponent.columnFilters,
			self = EmbedQueryGridComponent,
			app = this.app,
			qpFields = new Set(Object.keys(slice.query_params?.fields || {})),
			disable = this.disable || (this.disable = {});
		if (!slice?.fids) {
			console.warn('no fids were found.  was this manually set?');
			throw 'no_fids';
		}
		this.metaNew = slice?.meta?.presentation;
		// console.log(fields, 'fields');
		// console.log(meta, 'meta');

		this._slices
			.fetch(slice.id, {
				includeRootMeta: true
			})
			.subscribe((res) => {
				// console.log(res.root.meta.presentation, '--->metaRoot');
				this.newMetaRootData = res;
			});

		Object.entries(fields)
			.sort(([ak, av], [bk, bv]) => {
				const x = av.grid ? av.grid.columnOrder : 99999,
					y = bv.grid ? bv.grid.columnOrder : 99999;
				return x - y;
			})
			.forEach(([k, v]) => {
				// console.log(k, v);

				const def = rootFields[k];
				const fid = slice.fidById(k);
				if (this.types.types[k]) {
					const relation = fid?.relation
							? slice.relationships.get(fid.relation)
							: null,
						colId = k,
						visible =
							!v.grid ||
							!v.grid.display ||
							v.grid.display !== 'none',
						// order = this.slice.getSortOnField(k),
						order = this.slice.meta.presentation.grid.order,
						key = self.makeValueFormatterKey(k),
						filterModel: DEFAULT_COLUMN_FILTERS =
							filters[fid.relation ? 'string' : fid.renderHint],
						col: ColDef = {
							headerName: k,
							colId: k,
							field: k,
							enableRowGroup: true,
							enableValue: true,
							editable: true,
							hide: !visible,
							// autoHeight: true,
							headerClass:
								'customClassHeader' + v.grid?.columnOrder
							// rowGroup: true
						};
					// col.valueSetter = (params: ValueSetterParams) => {
					// 	console.log(params,'ValueSetterParams')
					// 	  return true;
					// 	}

					// if (fid.triggerMagic) {
					// 	col.hide = true;
					// }
					if (def) {
						col.headerName = col.headerTooltip =
							def.reportLabel || def.text || def.id;
					} else {
						col.headerName = col.headerTooltip = fid?.triggerMagic
							? app.translate(k)
							: k;
					}

					if (def) {
						switch (def.type) {
							case 'control_textbox':
								// ignore
								break;
							case 'control_formula_html':
								col.cellRendererFramework =
									this.components.html;
								break;
							case 'control_dropdown':
								console.log('dropdown');
								break;
							case 'control_fileupload':
								// console.log('file array', col, def);
								this._decorateColumnFileArray(col);
								// def.formpreview
								break;
						}
					}

					// queryFields[colId] = colId;
					// if (queryFields[colId]) {
					// 	col.valueFormatter = (p) => p.data[colId];
					// }

					if (relation) {
						if (!def) {
							queryFields[key] = [
								'$coalesce',
								[
									'$field',
									`${relation.name}:${Slice.SYSTEM_FIELDS[k]}`
								],
								['$field', k]
							];
						} else if (def.displayFormula) {
							queryFields[key] = makeRelatedDisplayFormula(
								k,
								def,
								relation
							);
						} else {
							console.warn(
								'unable to find related value expression, ignoring'
							);
						}
						if (queryFields[key]) {
							col.valueFormatter = (p) => p.data && p.data[key];
						}
						this._decorateColumnRelated(col, relation);
					}

					// if (filterModel) {
					// 	col.filter = filterModel;
					// } else {
					// 	console.warn(
					// 		'unmapped filter, it has been disabled on this column\n',
					// 		colId,
					// 		fid.renderHint,
					// 		filters
					// 	);
					// 	col.filter = false;
					// }
					// console.log('fid=>', fid, fid.label, def);
					if (
						fid.renderHint == 'date' ||
						fid.renderHint == 'datetime'
					) {
						(col.cellEditorFramework = DatepickerComponent),
							(col.cellEditorPopupPosition = 'above'),
							(col.cellEditorParams = {
								values: [{ fid: fid, def: def }]
							});
					}
					if (def && def.type == 'control_dropdown') {
						(col.cellEditorFramework = DropdownEditComponent),
							(col.cellEditorPopupPosition = 'under'),
							(col.cellEditorParams = {
								values: [{ fid: fid, def: def }]
							});
					}

					// disabling edit for special case columns
					if (
						fid.triggerMagic == 'id' ||
						fid.triggerMagic == 'creatorRef' ||
						fid.triggerMagic == 'created' ||
						fid.triggerMagic == 'modifierRef' ||
						fid.triggerMagic == 'modified'
					) {
						col.editable = false;
					}

					switch (fid.renderHint) {
						case 'datetime':
							this._decorateColumnDateTime(col, def);
							break;
						case 'date':
							this._decorateColumnDateTime(col, def);
							break;
						case 'string':
							if (fid.label == 'Photo') {
								col.cellRenderer = (params) => {
									if (params.value) {
										let WithOutBrackets =
											params.value.replace(
												/[\[\]']+/g,
												''
											);
										this.imageCheck =
											this.getFile(WithOutBrackets);
										return (
											'<img class="preview-size" src=' +
											this.imageCheck +
											'>'
										);
									}
								};
							}
							break;
					}
					// grid specific things
					if (v.grid) {
						if (v.grid.width) {
							col.width = Math.round(v.grid.width * 1.15);
						}
						if (v.grid.textAlign) {
							if (v.grid.textAlign == 'right') {
								col.cellClass = 'ag-right-aligned-cell';
								col.headerClass = 'ag-right-aligned-header';
							} else if (v.grid.textAlign == 'left') {
								col.cellClass = 'ag-left-aligned-cell';
								col.headerClass = 'ag-left-aligned-header';
							} else {
								col.cellClass = 'ag-center-aligned-cell';
								col.headerClass = 'ag-center-aligned-header';
							}
						}
					}
					if (order) {
						if (colId == order[0][1][1]) {
							col.sort = order[0][0] == '$desc' ? 'desc' : 'asc';
							// console.log(order, '==>fid--order')
						}
						// col.sort = order.descending ? 'desc' : 'asc';
						// col.sortedAt = order.index;
					}

					queryFields[k] = ['$field', k];
					cols.push(col);
				}
			});
		if (meta) {
			if (meta.hideHeaderButtons) {
				// disable.print = true;
				// disable.addRecord = true;
			}
			disable.viewRecord = !!meta.hideView;
			disable.editRecord = disable.deleteRecord = !!meta.hideEdit;
			disable.hideAddRelated = !!meta.hideAddRelated;
			disable.description = !meta.showDescription;
			disable.hideHeaderTitle = !!meta.hideHeaderTitle;

			disable.hidePrint = meta.hidePrint;
			disable.refreshInterval = meta.refreshInterval;
			disable.refreshAuto = meta.refreshAuto;
			disable.hideAddRecord = meta.hideAddRecord;

			if (disable.refreshAuto) {
				this.createSocketConnection();
			}
			if (disable.refreshInterval) {
				this.createIntervalForRefresh(+disable.refreshInterval);
			}

			this.description = (meta.description || '').trim() || null;
			this.isAdmin = this.app.getCurrentAuth().sysadmin;
			if (!this.isAdmin) {
				disable.header = !!meta.hideHeader;
			}
			disable.hideHeaderButtons = !!meta.hideHeaderButtons;

			if (!disable.hideAddRelated) {
				this.relations = [];

				for (const key of Object.keys(
					slice.allRelations.inbound as object
				)) {
					const inboundData = slice.allRelations.inbound[key];
					if (
						inboundData.fromSlice !== inboundData.toSlice &&
						inboundData.name !== 'creator' &&
						inboundData.name !== 'modifier' &&
						+key > 0
					) {
						this.relations.push(inboundData);
					}
				}
			}
		}
		// console.log(cols);
	}
	onColumnResized(params: ColumnResizedEvent) {
		this.datasource.saving.next(true);
		this.widthChanged = true;
		if (params.column != null) {
			this.changeWidth(params);
		} else if (params.column == null && params.columns.length > 1) {
			for (let i = 0; i < params.columns.length; i++) {
				this.changeWidthAllColumns(params.columns[i]);
			}
		}
	}
	onColumnMoved(e) {
		this.columnOrderArray = e.column.columnApi.getAllDisplayedColumns();
		this.columnOrderArray = this.columnOrderArray.filter(
			(data) =>
				data.colId != '0' && data.colId != '1' && data.colId != '2'
		);

		// this.changeOrder(e);
		this.datasource.saving.next(true);
		this.orderChanged = true;
	}
	changeOrder(params: any) {
		let Column = params.column.colId;
		let oldIndex =
			this.slice.meta.presentation.fields[Column].grid['columnOrder'];
		let newIndex = params.toIndex - 3;
		this.slice.meta.presentation.fields[Column].grid['columnOrder'] =
			newIndex;
	}

	changeWidth(params: any) {
		if (this.slice.meta.presentation) {
			let Column = params.column.colId;
			let width = params.column.actualWidth / 1.15;
			this.slice.meta.presentation.fields[Column].grid['width'] = width;
		}
	}
	changeWidthAllColumns(column: any) {
		if (column.colId != '0' && column.colId != '1' && column.colId != '2') {
			this.slice.meta.presentation.fields[column.colId].grid['width'] =
				column.actualWidth / 1.15;
		}
	}
	alignContent(colId, alignment) {
		this.datasource.saving.next(true);
		this.widthChanged = true;
		this.slice.meta.presentation.fields[colId].grid['textAlign'] =
			alignment;
	}

	createSocketConnection() {
		this.socketService
			.onRecordChanges(
				this.slice.parent || this.slice.id,
				this._api?.spoke
			)
			.subscribe((t) => {
				this.refresh();
			});
	}

	createIntervalForRefresh(interval: number) {
		if (interval > 0) {
			this.intervalRefresh = setInterval(() => {
				this.refresh();
				this._cd.detectChanges();
			}, interval * 1000);
		}
	}

	private _buildFromLegacy(slice: Slice, ser?: GridSerialized) {
		const meta = slice?.meta?.presentation as LegacyMetaPresentation,
			rootMeta = (slice?.root?.meta?.presentation ||
				{}) as JotMetaPresentation,
			qpFields = slice?.query_params?.fields || {},
			fields = meta?.fields || rootMeta?.fields || {},
			self = EmbedQueryGridComponent,
			rootFields = rootMeta.fields || {},
			queryFields = (this.query.fields = {}),
			filters = EmbedQueryGridComponent.columnFilters,
			cols = (this.columns = []),
			app = this.app,
			disable = this.disable || (this.disable = {});

		Object.entries(fields)
			.sort(([ak, av], [bk, bv]) => {
				const x = av.grid ? av.grid.columnOrder : 99999,
					y = bv.grid ? bv.grid.columnOrder : 99999;
				return x - y;
			})
			.forEach(([k, v]) => {
				// does this key exist in the fields, OR, is fields an asterisk?
				const def = rootFields[k],
					fid = slice.fidById(k),
					existsInQp = !!(qpFields[k] || qpFields['*']),
					visible =
						(!v.grid ||
							!v.grid.display ||
							v.grid.display !== 'none') &&
						existsInQp,
					order = this.slice.getSortOnField(k),
					key = self.makeValueFormatterKey(k),
					filterModel: DEFAULT_COLUMN_FILTERS =
						filters[fid.relation ? 'string' : fid.renderHint],
					rel = fid?.relation
						? slice.relationships.get(fid.relation)
						: null;
				// console.log(def, fid);

				const col: ColDef = {
					hide: !visible,
					headerName: k,
					colId: k,
					field: k,
					// rowGroup: true,
					enableValue: true,
					editable: true
				};

				if (def) {
					col.headerName = col.headerTooltip =
						def.reportLabel || def.text || def.id;
				} else {
					col.headerName = col.headerTooltip = fid?.triggerMagic
						? app.translate(k)
						: k;
				}

				if (rel) {
					if (!def) {
						queryFields[key] = [
							'$coalesce',
							['$field', `${rel.name}:${Slice.SYSTEM_FIELDS[k]}`],
							['$field', k]
						];
					} else if (def.displayFormula) {
						queryFields[key] = makeRelatedDisplayFormula(
							k,
							def,
							rel
						);
					} else {
						console.warn(
							'unable to find related value expression, ignoring'
						);
					}
					if (queryFields[key]) {
						col.valueFormatter = (p) => p.data[key];
					}
					this._decorateColumnRelated(col, rel);
				}

				// check for HTML stuffs...
				if (def) {
					switch (def.type) {
						case 'control_textbox':
							// ignore
							break;
						case 'control_formula_html':
							col.cellRendererFramework = this.components.html;
							break;
						case 'control_related_dropdown':
							if (!col.cellRendererFramework) {
								// this is slightly hacky, but we need to feed any required things to the decorator
								this._decorateColumnRelated(
									col,
									Object.assign(
										{},
										rel || ({} as Relationship),
										{ toSlice: def.relateToSlice }
									)
								);
							}
							break;
						case 'control_date':
							console.log('date', def);
							break;
						case 'control_fileupload':
							console.log('file array', col, def);
							this._decorateColumnFileArray(col);
							// def.formpreview
							break;
						default:
							console.warn(`unhandled type: ${def.type}\n`, def);
					}
				} else {
					// console.warn('no def found', col);
				}

				// grid specific things
				if (v.grid) {
					if (v.grid.width) {
						col.width = Math.round(v.grid.width * 1.15);
					}
				}

				if (order) {
					col.sort = order.descending ? 'desc' : 'asc';
					col.sortedAt = order.index;
				}

				queryFields[k] = ['$field', k];
				cols.push(col);
			});

		// legacy assumes everything is autoExpanding
		this.autoExpandGroups = true;

		if (meta) {
			disable.header = !!meta.hideHeader;
			if (meta.hideHeaderButtons) {
				// disable.print = true;
				// disable.addRecord = true;
			}
			disable.viewRecord = !!meta.hideView;
			disable.editRecord = disable.deleteRecord = !!meta.hideEdit;
			disable.hideAddRelated = !!meta.hideAddRelated;
			disable.description = !meta.showDescription;

			this.description = (meta.description || '').trim() || null;
		}

		// console.log('fin', {query: this.query, columns: this.columns});
	}
	getFile(c) {
		return this._api.getFileUrl(c);
	}
	isGroupOpenByDefault(params) {
		console.log(params);
	}
	refreshCache() {
		this.grid.api.refreshInfiniteCache();
		// this.grid.api.purgeInfiniteCache(); // Looks like not needed
	}

	getRowStyle = (params) => {
		this.rowStyleParams = params;
		// if (this.uniqueRecordsWithID.length > 0) {
		// 	for (let i = 0; i < this.uniqueRecordsWithID.length; i++) {
		// 		if (params && params.data) {
		// 			if (params.data.id == this.uniqueRecordsWithID[i].id) {
		// 				return { background: '#fff1b2 ' };
		// 			}
		// 		}
		// 	}
		// } else if (this.duplicateRecordsWithID.length > 0) {
		// 	for (let i = 0; i < this.duplicateRecordsWithID.length; i++) {
		// 		if (params && params.data) {
		// 			if (params.data.id == this.duplicateRecordsWithID[i].id) {
		// 				return { background: '#fff1b2 ' };
		// 			}
		// 		}
		// 	}
		// }

		// for (let i = 0; i < this.uniqueArr.length; i++) {
		// 	if (params && params.data) {
		// 		if (params.data.id == this.uniqueArr[i].id) {
		// 			return { background: '#fff1b2 ' };
		// 		}
		// 	}
		// }
	};
	getMainMenuItems = (params: GetMainMenuItemsParams) => {
		this.hiddenColumns = this.columns.filter((data) => data.hide);
		let menuItems: (MenuItemDef | string)[] = params.defaultItems.slice(0);
		menuItems = menuItems.filter((data) => data != 'separator');
		menuItems.splice(4, 1);
		// console.log('==>menuItems', menuItems);

		menuItems.push({
			name: 'Alignment',
			subMenu: [
				{
					name: 'Left',
					action: () => {
						const column = params.column.getColId();
						for (let i = 0; i < this.columns.length; i++) {
							if (this.columns[i].colId == column) {
								this.columns[i].cellClass =
									'ag-left-aligned-cell';
								this.columns[i].headerClass =
									'ag-left-aligned-header';
							}
						}
						this.alignContent(column, 'left');
						this._build(this.slice);
					}
				},
				{
					name: 'Center',
					action: () => {
						const column = params.column.getColId();
						for (let i = 0; i < this.columns.length; i++) {
							if (this.columns[i].colId == column) {
								this.columns[i].cellClass =
									'ag-center-aligned-cell';
								this.columns[i].headerClass =
									'ag-center-aligned-header';
							}
						}
						this.alignContent(column, 'center');
						this._build(this.slice);
					}
				},
				{
					name: 'Right',
					action: () => {
						const column = params.column.getColId();
						for (let i = 0; i < this.columns.length; i++) {
							if (this.columns[i].colId == column) {
								this.columns[i].cellClass =
									'ag-right-aligned-cell';
								this.columns[i].headerClass =
									'ag-right-aligned-header';
							}
						}
						this.alignContent(column, 'right');
						this._build(this.slice);
					}
				}
			]
		});

		let tmp = menuItems[4];
		menuItems[4] = menuItems[1];
		menuItems[1] = tmp;
		menuItems.push({
			name: 'Relabel',
			action: () => {
				// this.metaRoot.meta.presentation.fields[
				// 	params.column.getColId()
				// ].grid.display = 'none';

				let cl: any;
				cl = params.column.getColDef().headerClass;
				const clas = params.column.getColDef().headerClass;
				this.openDialogFunction(
					cl,
					params.column.getColDef().headerName
				);
				// params.api.refreshHeader();
			}
		});
		menuItems.push({
			name: 'Find Unique',
			action: () => {
				this.duplicateRecordsWithID = [];
				this.grid.api.deselectAll();
				const key = params.column.getColId();
				this.loading.next(true);
				this.getUniqueDuplicateData(key, 'uniqueData');
			}
		});
		menuItems.push({
			name: 'Find Duplicate',
			action: () => {
				this.uniqueRecordsWithID = [];
				this.grid.api.deselectAll();
				this.selectedEntity = [];
				const key = params.column.getColId();
				this.loading.next(true);
				this.getUniqueDuplicateData(key, 'duplicateData');
			}
		});
		menuItems.push({
			name: 'Show Columns',
			subMenu: []
		});
		menuItems.push({
			name: 'Hide Column',
			action: () => {
				params.columnApi.setColumnsVisible(
					[params.column.getColId()],
					false
				);
				for (let i = 0; i < this.columns.length; i++) {
					if (this.columns[i].colId == params.column.getColId()) {
						this.columns[i].hide = true;
					}
				}
				this.columnChanged = true;
				this.metaRoot.meta.presentation.fields[
					params.column.getColId()
				].grid.display = 'none';

				this.datasource.saving.next(true);
			}
		});
		menuItems.push({
			name: 'Find & Replace',
			action: () => {
				this.findAndReplace(params.column.getColId());
			}
		});

		this.getSubmenuData(menuItems, params);
		return menuItems;
	};

	getUniqueDuplicateData(columnName: any, type: any) {
		let data = {
			'$/slice/report': {
				slice: this.slice.id,
				where: {},
				fields: {
					_value: columnName,
					_count: ['$count', ['$field', columnName]]
				},
				userparams: {},
				group: [['$field', '_value']]
			}
		};
		this._api.request({ data }).subscribe((re: any) => {
			let filteredCount = 0;
			if (type == 'uniqueData') {
				this.positive_array = re.data.rows;
			} else if (type == 'duplicateData') {
				this.positive_array = re.data.rows.filter(
					(value) => value._count != 1
				);
				filteredCount = this.positive_array.length;
			}

			let dataReduced = [];
			let val = this.positive_array.reduce(function (a, b) {
				dataReduced.push(b._value);
				return dataReduced;
			}, []);

			let groupedData = {
				'$/slice/report': {
					slice: this.slice.id,
					fields: { [columnName]: columnName, id: 'id' },
					where: ['$in', ['$field', columnName], val],
					userparams: {}
				}
			};
			this._api.request(groupedData).subscribe((re: any) => {
				if (type == 'uniqueData') {
					this.uniqueRecordsWithID = _.uniqBy(re.rows, columnName);
					this.grid.api.forEachNode((node) => {
						if (
							this.uniqueRecordsWithID.filter(
								(data) => data.id == node.data.id
							).length > 0
						) {
							node.setSelected(true);
						}
					});
					if (this.rowSelection === 'multiple') {
						this.selectedEntity = this.grid.api.getSelectedRows();
					} else {
						this.selectedEntity =
							this.grid.api.getSelectedRows()[0];
					}
					this.app.notify.informNew(
						this.uniqueRecordsWithID.length +
							' Unique Records Found'
					);
				} else if (type == 'duplicateData') {
					this.duplicateRecordsWithID = difference(
						re.rows,
						uniqBy(re.rows, columnName),
						columnName
					);
					this.grid.api.forEachNode((node) => {
						if (
							this.duplicateRecordsWithID.filter(
								(data) => data.id == node.data.id
							).length > 0
						) {
							node.setSelected(true);
						}
					});
					if (this.rowSelection === 'multiple') {
						this.selectedEntity = this.grid.api.getSelectedRows();
					} else {
						this.selectedEntity =
							this.grid.api.getSelectedRows()[0];
					}

					this.app.notify.informNew(
						this.duplicateRecordsWithID.length +
							' Duplicate Records Found'
					);
				}
				// this.refreshCache();
				this.grid.api.redrawRows();
				this.loading.next(false);
			});
		});
		if (this.rowSelection === 'multiple') {
			this.selectedEntity = this.grid.api.getSelectedRows();
		} else {
			this.selectedEntity = this.grid.api.getSelectedRows()[0];
		}
	}

	openDialogFunction(className: any, name: any) {
		let ele = document.getElementsByClassName(className)[0] as any;

		let dialogRef = this.dialogService.openDialog({
			positionRelativeToElement: { nativeElement: ele },
			name: name
		});

		dialogRef.afterClosed().subscribe((res) => {
			dialogRef = null;
			if (res.isTabPressed == true) {
				this.showNextHeader(name, dialogRef);
			} else {
				for (const [key, value] of Object.entries(
					this.metaRoot.root.meta.presentation.fields
				)) {
					let data = [value] as any;
					if (data[0].reportLabel == name) {
						console.log(
							data[0],
							this.metaRoot.root.meta.presentation.fields,
							res.data
						);

						this.metaRoot.root.meta.presentation.fields[
							data[0].id
						].reportLabel = res.data;
					}
				}
				this.columnRelabled = true;
				this.save();

				console.log(this.metaRoot);
				// this.datasource.saving.next(true);
			}
		});
	}
	openDeleteDialog(): void {
		let dataArray;
		if (this.selectedEntity.length > 0) {
			dataArray = this.selectedEntity;
		} else if (this.allSelectedEnities.length > 0) {
			dataArray = this.allSelectedEnities;
		}
		const dialogRef = this._dialog.open(DeleteDialogComponent, {
			width: '310px',
			hasBackdrop: true,
			data: { records: dataArray.length }
		});

		dialogRef.afterClosed().subscribe((result) => {
			if (result.data == true) {
				this.save();
				this.selectedEntity = [];
				this.allSelectedEnities = [];
			} else if (result.data == false) {
				for (let i = 0; i < dataArray.length; i++) {
					this.deleteRowClick(dataArray[i]);
				}
			}
			//   this.grid.api.redrawRows();
			this.refreshData();
		});
	}
	showNextHeader(previousHeaderName, dialogRef) {
		var index = this.columns.findIndex(
			(p) => p.headerName == previousHeaderName
		);
		if (index + 4 == this.columns.length) {
			dialogRef.afterClosed().subscribe((res) => {
				dialogRef = null;
			});
		} else {
			this.openDialogFunction(
				this.columns[index + 1].headerClass,
				this.columns[index + 1].headerName
			);
		}
	}

	getSubmenuData(menuItems, params) {
		var index = menuItems.findIndex((p) => p.name == 'Show Columns');
		for (let i = 0; i < this.hiddenColumns.length; i++) {
			menuItems[index].subMenu.push({
				name: this.hiddenColumns[i].colId,
				action: () => {
					params.columnApi.setColumnVisible(
						this.hiddenColumns[i].colId,
						true
					);
					// console.log(this.getAllRows())
					// this._buildColumnsFromFids(this.slice);
					for (let j = 0; j < this.columns.length; j++) {
						if (
							this.columns[j].colId == this.hiddenColumns[i].colId
						) {
							this.columns[j].hide = false;
							params.api.refreshHeader();
						}
					}
					this.columnChanged = true;
					delete this.metaRoot.meta.presentation.fields[
						this.hiddenColumns[i].colId
					].grid['display'];

					this.datasource.saving.next(true);
				}
			});
		}
	}
	printSortState(e) {
		this.isColumnSorted = true;
		let columnWithSort = this.columnApi
			.getColumnState()
			.find((col) => col.sort !== null);
		const columnName = this.columnApi.getColumnState();
		// console.log(e, columnName, columnWithSort);
		if (this.slice.meta.presentation) {
			this.slice.meta.presentation.grid.order = [
				['$' + columnWithSort?.sort, ['$field', columnWithSort?.colId]]
			];
			this.datasource.saving.next(true);
		}
	}

	private _decorateColumnRelated(col: ColDef, rel: Relationship) {
		col.cellRendererFramework = this.components.routedLink;
		col.cellRendererParams = {
			url: (data: any) => {
				if (data) {
					const targetId = data[rel.fromCol];
					if (targetId) {
						return rel && (data[col.field] || data[col.field] === 0)
							? `/form/${rel.toSlice}/${targetId}`
							: '';
					} else {
						return '';
					}
				}
			}
		};
	}

	private _decorateColumnFileArray(col: ColDef) {
		col.cellRendererFramework = this.components.fileArray;
		// if we build up a stack of additional requests in an array
	}

	private _decorateColumnDateTime(col: ColDef, def) {
		if (def) {
			let changedFormat =
				def.format +
				' ' +
				(def.datalynk_hourformat ? def.datalynk_hourformat : '');
			if (def.hideDateTime == 'Time') {
				changedFormat = changedFormat.slice(0, -6);
			} else if (def.allowAMPM == 'No') {
				changedFormat = changedFormat.slice(0, -1);
			}

			col.cellRendererFramework = this.components.dateTime;
			col.cellRendererParams = {
				format: changedFormat
			};
		} else {
			// special case columns format i.e id, created by, modified by
			col.cellRendererFramework = this.components.dateTime;
			col.cellRendererParams = {
				format: 'yyyy/MM/dd, h:mm:ss aaaaa'
			};
		}
	}
}
