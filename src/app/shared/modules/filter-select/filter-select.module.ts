import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterSelectComponent } from './filter-select/filter-select.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
	declarations: [
		FilterSelectComponent
	],
	imports: [
		ReactiveFormsModule,
		CommonModule,
		MatInputModule,
		MatFormFieldModule,
		MatAutocompleteModule,
		MatIconModule,
	],
	exports: [
		FilterSelectComponent,
	]
})
export class FilterSelectModule { }
