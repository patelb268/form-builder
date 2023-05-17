import {
	Component,
	ChangeDetectionStrategy,
	OnInit,
	ElementRef,
} from "@angular/core";
import { ControlBase } from "../control-base";
import {
	DlDropdownControl,
	OptionRowValue,
	OptionRow,
} from "../../models/control";
import { searchStringToArrayPipe } from "src/app/shared/utils/searchStringToArray";
import {
	takeWhile,
	map,
	startWith,
	withLatestFrom,
	shareReplay,
	debounceTime,
} from "rxjs/operators";
import { Observable, of } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";

@Component({
	selector: "app-control-dropdown",
	templateUrl: "./control-dropdown.component.html",
	styleUrls: ["./control-dropdown.component.scss"],
})
export class ControlDropdownComponent
	extends ControlBase<DlDropdownControl>
	implements OnInit
{
	constructor(private _http: HttpClient, el: ElementRef) {
		super(el);
	}

	limit = 100;
	filteredOptions: Observable<OptionRow[]>;
	options: Observable<OptionRow[]>;

	private _allOptions: OptionRow[] = [];

	async ngOnInit() {
		super.ngOnInit();

		const p = this.params;

		const fetch = p.fetch;

		if (fetch?.url) {
			this.options = this._http
				.get(
					environment.production ? "/modules" + fetch.url : fetch.url,
					{ responseType: "json" }
				)
				.pipe(
					map((res) => {
						const options = res as OptionRow[];
						this._allOptions = options;
						return options;
					}),
					shareReplay(1)
				);
		} else if (p.options) {
			this._allOptions = p.options;
			this.options = of(p.options).pipe(shareReplay(1));
		} else {
			console.warn("INVALID params, no options will be available", {
				p,
				this: this,
			});
			this.options = of((this._allOptions = [])).pipe(shareReplay(1));
		}

		this.filteredOptions = this.control.valueChanges.pipe(
			startWith(this.control.value),
			searchStringToArrayPipe(),
			takeWhile(() => !this._destroyed),
			map((terms) => terms.map((t) => new RegExp(t, "i"))),
			withLatestFrom(this.options),
			map(([terms, options]) => this._getMatches(terms, options))
		);

		this.params._notInListValidation = (x) => {
			return this.options.pipe(
				debounceTime(250),
				map((options) =>
					options.find((o) => o._v === x) ? true : false
				)
			);
		};
	}

	dropdownDisplayFn(value: OptionRowValue) {
		const row = this._getOptionRow(value);
		return row ? row._l : null;
	}

	// when the value is changed via typing (and not via the selection)
	// we need to make a check to see if the value is just an improper
	// case of something in the list that is an exact match
	// {value: 'O', label: 'O'} => control.value = 'o'
	// this would set the value to 'O' automatically
	onChange() {
		const c = this.control,
			val = c.value,
			row = val ? this._getOptionRow(c.value) : null;

		if (val && !row) {
			const match = this._getMatches(
				[new RegExp(val, "i")],
				this._allOptions
			).shift();
			if (match) {
				c.setValue(match._v);
			}
		}
	}

	private _getOptionRow(value: OptionRowValue) {
		return this._allOptions.find((o) => o._v === value);
	}

	private _getMatches(
		terms: RegExp[],
		options: OptionRow[],
		property: keyof OptionRow = "_l"
	): OptionRow[] {
		const p = this.params,
			limit = p.limit && p.limit > 0 ? p.limit : this.limit;

		if (terms.length) {
			return options
				.filter((o) => terms.every((t) => t.test("" + o[property])))
				.slice(0, limit);
		} else {
			return options.slice(0, limit);
		}
	}
}
