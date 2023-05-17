import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { AppService } from '@services/app.service';
import { ImportService } from '../../services/import.service';
import { FormControl, Validators } from '@angular/forms';
import { ApiService } from '@services/api.service';
import { SliceService } from '@services/slice.service';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { orderBy } from 'lodash';

const VALID_EXTENSIONS = ['.csv'];

@Component({
	selector: 'app-import-test',
	templateUrl: './import-test.component.html',
	styleUrls: ['./import-test.component.scss'],
})
export class ImportTestComponent implements OnInit {

	fileExtensions = VALID_EXTENSIONS.slice(); // copy, to avoid the taint..

	file = new FormControl(null);
	headerData: any;
	CSVSplitData = [];
	rowData: any;
	importLabel = 'import';
	headerTypeData = [];
	headerDef = [];
	headerTypeDef = []
	headerNameDef = [];
	fileId: any;
	sliceId: any;
	colInfoSubmit = [];
	existingColumnInfo = [];
	headerexistingCol = [];
	fileInput: any;
	selectedImport = '';
	saveImport: any;
	loadSavedData = [];
	loadSavedNames = [];
	selectedLoadSetting: any;
	metaInfo: any;
	newImport: any;

	constructor(
		public app: AppService,
		private _import: ImportService,
		private _api: ApiService,
		private _slices: SliceService,
		private route: ActivatedRoute
	) { }

	ngOnInit(): void {
		this.file.valueChanges
			.subscribe(files => {
				console.log('files', files);
			})
		this.route.paramMap.subscribe((params: ParamMap) => {
			this.sliceId = params.get('slice');
			this.getOutboundData();
		// this._api
		// 	.request({
		// 		'$/schema/alterColumns':
		// 		{
		// 			table: { '$/slice/fetch': { slice: this.sliceId }, $pop: 'source_table' }
		// 			, columns: { last_name: null }
		// 		}

		// 	})
		// 	.subscribe((r: any) => {
		// 		console.log(r)

		// 	});
		});
	};



		getOutboundData() {
			this._slices.getAllSliceDetailWithMeta().subscribe(async r => {
				const sliceDetail = r[1].rows.find(
					(y) => y.id === parseInt(this.sliceId)
				);
				let fields: any = sliceDetail?.meta.presentation.fields;
				const report = await this._slices.fetch(this.sliceId).toPromise();

				let applicableOutboundData = [];
				const outBounds = report.allRelations.outbound;
				console.log(outBounds);
				Object.keys(outBounds).forEach((t) => {
					if (
						outBounds[t].name &&
						(outBounds[t].id > 0 || outBounds[t].specialCase)
					) {
						let isRelatedSliceExistsInMeta = false;
						if(fields){
							Object.keys(fields).forEach((ff) => {
								if (
									fields[ff].relateToSlice &&
									fields[ff].name === outBounds[t].name
								) {
									isRelatedSliceExistsInMeta = true;
								}
							});
							if (!isRelatedSliceExistsInMeta) {
								const outBoundField = {
									reportLabel: outBounds[t].fromCol,
									relateToSlice: outBounds[t].toSlice,
									id: outBounds[t].fromCol,
									fieldName: outBounds[t].fromCol,
									type: outBounds[t].type || 'control_related_dropdown'
								};
								applicableOutboundData.push(outBoundField);
							}
						}
						
					}
				});

				orderBy(applicableOutboundData, (tt) => tt.reportLabel, 'asc').forEach(
					(y) => {
						fields[y.id] = y;
					}
				);
				console.log(applicableOutboundData, 'outboundata')

			});
		}
		uploadFile(event: Event) {
			const element = event.currentTarget as HTMLInputElement;
			let fileList: FileList | null = element.files;
			if (fileList) {
				console.log("FileUpload -> files", fileList[0]);
				this._api.upload(fileList).subscribe(res => {
					console.log(res);
					this.getCSVSplit(res[0].id);
				})
			}
		}
		changeImportOptions() {
			this.headerNameDef.forEach((ele, index) => {
				this.headerNameDef[index] = '';
			});
			if (this.importLabel != 'import') {
				this.headerData = this.CSVSplitData[0];
				this.CSVSplitData[1].forEach(element => {
					console.log(element + '==>' + typeof (element))
				});
				this.rowData = this.CSVSplitData.slice(1);
			} else {
				this.rowData = this.CSVSplitData;
				this.CSVSplitData[0].forEach(element => {
					console.log(element + '==>' + typeof (element))
				});
				this.headerData = this.CSVSplitData[0];
			}

			if (this.importLabel == 'first_row') {
				this.CSVSplitData[0].forEach((element, index) => {
					this.headerNameDef[index] = element;
				});
			}

			this.checktypes();

		}
		checkColDef(evt, data) {
			console.log(this.headerDef, evt, data);

		}
		checkTypeDef(evt, data) {
			console.log(this.headerTypeDef);
		}
		deleteImport() {
			delete this.metaInfo.importSaves[this.selectedLoadSetting];
			this._api
				.request({
					'$/slice/modify':
					{
						slice: {
							id: this.sliceId,
							meta: this.metaInfo
						}
					}
				})
				.subscribe((r: any) => {
					if (r) {
						this.app.notify.success(
							this.selectedImport + " settings deleted successfully."
						);
						this.getColumns();
						this.selectedImport = '';
					}
				});

		}
		saveImportInfo() {
			let dataObj,
				columnInfoArray = [],
				firstRowDesc,
				format = [];
			// let size = Object.keys(this.metaInfo.presentation.fields).length;
			let size = this.CSVSplitData[0].length;

			for (let i = 0; i < size; i++) {
				let headerDef = (this.headerDef[i] == "new_column") ? "NEW" : (this.headerDef[i] == "existing_column") ? "EXISTING" : (this.headerDef[i] == "ignore") ? "IGNORE" : "EXISTING_ID";
				let headerTypeDef = (this.headerTypeDef[i] == "number") ? 'int' : this.headerTypeDef[i];
				let headerName;
				if (this.headerDef[i] == 'new_column') {
					headerName = this.headerNameDef[i]
				} else {
					headerName = this.headerexistingCol[i]

				}
				columnInfoArray[i] = [headerDef, headerTypeDef, headerName];
				format.push('');

			}
			firstRowDesc = (this.importLabel == "first_row") ? "usefirst" : (this.importLabel == "skip_first") ? "skipfirst" : "default";


			dataObj = {
				columnCount: size,
				columns: columnInfoArray,
				firstRow: firstRowDesc,
				formatters: format,
				modified: Date.now()
			}
			if(this.metaInfo?.importSaves){

			} else {
				this.metaInfo['importSaves'] = {};
				this.metaInfo['importSaves'][this.newImport] = dataObj;

			}
			this._api
			.request({
				'$/slice/modify':
				{
					slice: {
						id: this.sliceId,
						meta: this.metaInfo
					}
				}
			})
			.subscribe((r: any) => {
				if (r) {
					this.getColumns();
				}
			});

			
		}

		getCSVSplit(id) {
			this.fileId = id;
			this._api
				.request({
					'$/tools/csv_split':
					{
						file: id,
						count: 11
					}
				})
				.subscribe((r: any) => {
					if (r) {
						this.getColumns();
						this.CSVSplitData = r.lines;
						this.rowData = r.lines;
						this.headerData = this.CSVSplitData[0];
						this.headerData.forEach((element, index) => {
							this.headerDef[index] = 'new_column';
						});
						this.checktypes();

					}
				});
		}

		getColumns() {
			this._api
				.request({
					'$/tools/action_chain': [
						{
							'!/slice/report': {
								slice: this.sliceId,
								fields: { '*': '*' },
								limit: 1,
								return: { types: 1 }
							}
						},
						{
							'!/slice/permissions': {
								where: {
									id: {
										$in: [
											this.sliceId
										]
									}
								}
							}
						},
						{ $_: '*' }
					]
				})
				.subscribe((r: any) => {
					if (r) {
						this.existingColumnInfo = [];
						// this.existingColumnInfo = r[0].types;
						for (const key in r[0].types) {
							this.existingColumnInfo.push({ Name: key, Type: r[0].types[key]['user'] });

							// console.log(`${key}: ${r[0].types[key]['user']}`);
						}
						this.metaInfo = r[1].rows[0].meta;
						if (r[1].rows[0].meta?.importSaves) {
							this.loadSavedData = r[1].rows[0].meta?.importSaves;
							this.loadSavedNames = Object.keys(this.loadSavedData);
						}
						console.log(r, 'r');
					}
				});
		}
		checkLoadImport(evt) {
			console.log(evt);
			this.selectedLoadSetting = evt;
			if (evt) {
				console.log(this.loadSavedData[evt]);
				let data = this.loadSavedData[evt];
				for (let i = 0; i < data.columnCount; i++) {
					this.headerDef[i] = (data.columns[i][0] == "NEW") ? "new_column" : (data.columns[i][0] == "EXISTING") ? "existing_column" : (data.columns[i][0] == "IGNORE") ? "ignore" : "column_identifier";
					this.headerTypeDef[i] = (data.columns[i][1] == "int") ? 'number' : data.columns[i][1];
					if (this.headerDef[i] == 'new_column') {
						this.headerNameDef[i] = data.columns[i][2];
					} else {
						this.headerexistingCol[i] = data.columns[i][2];
					}

					this.importLabel = (data.firstRow == "usefirst") ? "first_row" : (data.firstRow == "skipfirst") ? "skip_first" : "import";
					if (this.importLabel != "import") {
						this.rowData = this.CSVSplitData.slice(1);
					} else {
						this.rowData = this.CSVSplitData;
					}

				}


			}

		}
		saveFile() {
			if (this.saveImport) {
				if ((this.newImport == undefined) || (this.newImport == null) || (this.newImport == '')) {
					this.app.notify.warn(
						'Please enter the import label.'
					);
					return true;
				} else {
					this.saveImportInfo();

				}
				// return

			}
			this.colInfoSubmit = [];
			let hasErrors = this.checkErrors();

			for (let i = 0; i < this.headerDef.length; i++) {
				let dataType = this.headerTypeData[i];
				if (this.headerTypeData[i] == 'number') {
					dataType = 'int'
				}
				if (this.headerDef[i] == 'ignore') {
					this.colInfoSubmit.push(null);
					this.headerNameDef[i] = 'ignore';
				} else if (this.headerDef[i] == 'existing_column') {
					this.colInfoSubmit.push([this.headerexistingCol[i], dataType]);
				} else if (this.headerDef[i] == 'column_identifier') {
					this.colInfoSubmit.push([this.headerexistingCol[i], 'lookup']);
				} else {
					console.log(this.headerNameDef[i]);
					this.headerNameDef[i] = this.headerNameDef[i]?.replace(/^[ ]+|[ ]+$/g, '')
					const firstChar = this.headerNameDef[i].charAt(0);
					if (/^[0-9]+$/.test(firstChar)) {
						this.app.notify.warn(
							"The column label " + this.headerNameDef[i] + ' first character cannot be numerical.'
						);
						return;
					} else if (/[`!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~]/.test(this.headerNameDef[i])) {
						this.app.notify.warn(
							"The column label " + this.headerNameDef[i] + ' cannot have special characters.'
						);
						return;
					}

					this.colInfoSubmit.push([this.headerNameDef[i], dataType]);
				}
			}

			// let hasErrors = this.checkErrors();
			if (!hasErrors) {
				let dataObj = {
					"file": this.fileId,
					"slice": this.sliceId,
					"columns": this.colInfoSubmit,
				}
				if (this.importLabel != 'import') {
					dataObj["skipLines"] = 1;
				}
				console.log(this.colInfoSubmit);
				this._api
					.request({
						'$/usertable/import_csv': dataObj
					}).subscribe((r: any) => {
						console.log(r);
						if (r) {
							this.app.notify.success(
								'Congratulations, your data has been imported succesfully.'
							);
							this.CSVSplitData = [];
							this.headerData = undefined;
							this.headerDef = [];
							this.headerTypeData = [];
							this.headerNameDef = [];
							this.rowData = undefined;
							this.headerTypeDef = []
							this.colInfoSubmit = [];
							this.existingColumnInfo = [];
							this.headerexistingCol = [];
							this.fileInput = '';
						}
					},
						err => {
							console.log('HTTP Error', err)
							this.app.notify.warn(
								err
							);
						});
			}



		}
		checkErrors() {
			console.log(this.existingColumnInfo, this.headerNameDef)
			for (let i = 0; i < this.headerDef.length; i++) {
				if (this.headerDef[i] == 'new_column') {
					if ((this.headerNameDef[i] == undefined) || (this.headerNameDef[i] == null) || (this.headerNameDef[i] == '')) {
						this.app.notify.warn(
							'One or more of the required columns are missing a label.'
						);
						return true;
					}
					if ((this.headerNameDef[i]?.toLowerCase() == 'id')&& (this.headerDef[i] == 'new_column')) {
						console.log('Column Id already exists.')
						this.app.notify.warn(
							'Column label "Id" already exists.'
						);
						return true;
					}
					for (let j = 0; j < this.headerNameDef.length; j++) {
						let existingColCheck = this.existingColumnInfo.filter((data) => data.Name == this.headerNameDef[j]);
						if ((existingColCheck.length > 0) && (this.headerDef[j] == 'new_column')) {
								this.app.notify.warn(
									this.headerNameDef[j] + ' column label already exists.'
								);
								return true;
							
						}

					}

				} else if (this.headerDef[i] == 'existing_column') {
					if ((this.headerexistingCol[i] == undefined) || (this.headerexistingCol[i] == null) || (this.headerexistingCol[i] == '')) {
						this.app.notify.warn(
							'One or more of the required columns are missing a label.'
						);
						return true;
					}
				}
			}
			return false;

		}
		checktypes() {
			this.headerTypeData = [];
			let type,
				splits,
				delimiter,
				yearPosition,
				format,
				order,
				finalTypeArray,
				x;

			if (this.importLabel != 'import') {
				finalTypeArray = this.CSVSplitData[1];
			} else {
				finalTypeArray = this.CSVSplitData[0];

			}

			for (let i = 0; i < finalTypeArray.length; i++) {
				var item = finalTypeArray[i];
				if (typeof item == "undefined" || item == null) {
					item = "";
				}

				if (item.match("^[a-zA-Z0-9.]*$")) {

					if (this.isFloat(parseFloat(item))) {
						type = 'decimal';
					} else if (this.isInt(parseInt(item))) {
						if (parseInt(item) >= 2147483647) {
							type = 'text';
						} else {
							type = 'number';
						}
					} else if (item == "") {
						type = 'text';
					} else {
						type = 'text';
					}

				} else {
					if (item.indexOf("-") == -1 && item.indexOf("/") == -1) {
						type = 'text';
					} else {
						if (this.isNumber(item)) {

							type = 'date';

							if (item.indexOf(" ") > -1) {
								type = 'datetime';
								x = item.split(" ");
								item = x[0];
							}

							if (item.indexOf("-") > -1) {
								delimiter = '-';
								splits = item.split('-');
							} else if (item.indexOf("/") > -1) {
								delimiter = '/';
								splits = item.split('/');
							} else {
								type = 'text'; // unknown format, default to text
							}

							if (typeof splits != 'undefined') {
								if (splits.length == 3) {
									if (splits[2].length == 4) {
										yearPosition.push('last');
										// Only push onto the order array if the order
										// is not ambiguous.
										if (splits[0] > 12) {
											format = 'dd' + delimiter + 'MM' + delimiter + 'yyyy';
											if (order.indexOf("%d" + delimiter + "%m" + delimiter + "%Y") == -1) {
												order.push("%d" + delimiter + "%m" + delimiter + "%Y");
											}
										} else if (splits[1] > 12) {
											format = 'MM' + delimiter + 'dd' + delimiter + 'yyyy';
											if (order.indexOf("%m" + delimiter + "%d" + delimiter + "%Y") == -1) {
												order.push("%m" + delimiter + "%d" + delimiter + "%Y");
											}
										}
									} else if (splits[0].length == 4) {
										yearPosition.push('first');
										// Only push onto the order array if the order
										// is not ambiguous.
										if (splits[2] > 12) {
											format = 'yyyy' + delimiter + 'MM' + delimiter + 'dd';
											if (order.indexOf("%Y" + delimiter + "%m" + delimiter + "%d") == -1) {
												order.push("%Y" + delimiter + "%m" + delimiter + "%d");
											}
										} else if (splits[1] > 12) {
											format = 'yyyy' + delimiter + 'dd' + delimiter + 'MM';
											if (order.indexOf("%Y" + delimiter + "%d" + delimiter + "%m") == -1) {
												order.push("%Y" + delimiter + "%d" + delimiter + "%m");
											}
										}
									} else {
										type = 'text'; // unknown format, default to text
									}
								}
							} else {
								type = 'text'; // unknown format, default to text
							}
						} else {
							type = 'text'; // unknown format, default to text
						}
					}

				}
				if (type == 'text' && item.length > 120) {
					type = 'paragraph';
				}
				// this.headerTypeData.forEach((element, index) => {
				this.headerTypeDef[i] = type;
				// });
				this.headerTypeData.push(type);
			}

			console.log(this.headerTypeData);

		}


		isNumber(item) { return !isNaN(parseFloat(item)) }

		isInt(n) {
			return Number(n) === n && n % 1 === 0;
		}

		isFloat(n) {
			return n === Number(n) && n % 1 !== 0;
		}

	}
