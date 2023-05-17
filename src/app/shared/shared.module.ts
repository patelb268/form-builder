/**
 * This module is intended to be consumed by any other module
 * you may create.  Please declare and export anything that is shared
 * except for Services - those should be in the core app.module
 *
 * the services are done this way so all modules use the same injected
 * instance.  If you need your module to instance a new variant, feel free
 * to overwrite this (but do so with caution)
 */

import { NgModule, NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule, MAT_EXPANSION_PANEL_DEFAULT_OPTIONS } from '@angular/material/expansion';
import { MatFormFieldModule, MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule, MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { DebugComponent } from './components/debug/debug.component';
import { TranslatePipe } from './pipes/translate.pipe';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { SafePipe } from './pipes/safe.pipe';
import { ViewNotificationComponent } from './components/view-notification/view-notification.component';
import { RecordFooterComponent } from './components/record-footer/record-footer.component';
import { RouterModule } from '@angular/router';
import { LocaleDatePipe } from './pipes/locale-date.pipe';
import { HttpClientModule } from '@angular/common/http';
import { NativeElementDirective } from './directives/nativeElement.directive';
import { CaseDirective } from './directives/case.directive';
import { ClickOutsideDirective } from './directives/click-outside.directive';


import { TextFieldModule } from '@angular/cdk/text-field';
import { VerifySmsComponent } from './components/verify-sms/verify-sms.component';
import { VerifyGoogleAuthenticatorComponent } from './components/verify-google-authenticator/verify-google-authenticator.component';
import { ErrorComponent } from './components/error/error.component';
import { FileUploaderComponent } from './components/file-uploader/file-uploader.component';
import { NavigateActionContainerComponent } from './components/navigate-container/navigate-actions/navigate-actions.component';
import { NavigateContainerComponent } from './components/navigate-container/navigate-container/navigate-container.component';
import { NavigateSectionContainerComponent } from './components/navigate-container/navigate-section/navigate-section.component';
import { FilterSelectModule } from './modules/filter-select/filter-select.module';
import { MatTreeModule } from '@angular/material/tree';
import { MatBadgeModule } from '@angular/material/badge';
import { HomeComponent } from './settings/home/home.component';
import { ProfileComponent } from './settings/profile/profile.component';
import { WhereComponent } from './components/where/where.component';
import { FieldsDropdownComponent } from './components/fields-dropdown/fields-dropdown.component';
import { AgGridModule } from 'ag-grid-angular';
import { HtmlRendererComponent } from './components/grid/renderers/html-renderer/html-renderer.component';
import { ActionIconComponent } from './components/grid/renderers/action-icon/action-icon.component';
import { DateTimeComponent } from './components/grid/renderers/date-time/date-time.component';
import { RoutedIconComponent } from './components/grid/renderers/routed-icon/routed-icon.component';
import { NotificationLinkComponent } from './components/grid/renderers/notification-link/notification-link.component';
import { IconValueComponent } from './components/grid/renderers/icon-value/icon-value.component';
import { FileArrayComponent } from './components/grid/renderers/file-array/file-array.component';
import { YesOrNoComponent } from './components/grid/renderers/yes-or-no/yes-or-no.component';
import { RoutedLinkComponent } from './components/grid/renderers/routed-link/routed-link.component';
import { CheckboxComponent } from './components/grid/renderers/checkbox/checkbox.component';
import { AgGridComponent } from './components/grid/ag-grid.component';
import { IconDialogComponent } from './components/icon-dialog/icon-dialog.component';
import { FindAndReplaceComponent } from './components/find-and-replace/find-and-replace.component';
import { FindAndReplaceAngularComponent } from './components/find-and-replace-angular/find-and-replace-angular.component'
import { InputComponent } from './components/input/input.component';
import { MatRadioModule } from '@angular/material/radio';
import { DlDateTimeModule } from './modules/dl-date-time/dl-date-time.module';
import { NgxMatDatetimePickerModule, NgxMatNativeDateModule, NgxMatTimepickerModule } from '@angular-material-components/datetime-picker';
import { CustomErrorDialogComponent } from './components/custom-error-dialog/custom-error-dialog.component';
import { ConditionWizardComponent } from './components/condition-wizard/condition-wizard.component';
import { MatTableModule } from '@angular/material/table';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { HeaderDialogComponent } from './components/header-dialog/header-dialog.component';
import { HeaderDialogService } from './components/header-dialog/header-dialog.service';
import { DeleteDialogComponent } from './components/delete-dialog/delete-dialog.component';
import { HeaderComponent } from './components/grid/renderers/header/header.component';
import { DatepickerComponent } from './components/datepicker/datepicker.component';
import { DropdownEditComponent } from './components/dropdown-edit/dropdown-edit.component';
import { FieldSelectorComponent } from './field-selector/field-selector.component';
import { ParameterSelectorComponent } from './parameter-selector/parameter-selector.component';
import { CustomColorPaletteComponent } from './components/custom-color-palette/custom-color-palette.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';


export const agGridModule = AgGridModule.withComponents([
	HtmlRendererComponent,
	RoutedLinkComponent,
	DateTimeComponent,
	RoutedIconComponent,
	ActionIconComponent,
	NotificationLinkComponent,
	IconValueComponent,
	FileArrayComponent,
	YesOrNoComponent,
	CheckboxComponent,
]);

@NgModule({
	declarations: [ // components, directives and pipes
		DebugComponent,
		TranslatePipe,
		ConfirmDialogComponent,
		SafePipe,
		ViewNotificationComponent,
		RecordFooterComponent,
		LocaleDatePipe,
		NativeElementDirective,
		CaseDirective,
		VerifySmsComponent,
		VerifyGoogleAuthenticatorComponent,
		ErrorComponent,
		FileUploaderComponent,
		NavigateActionContainerComponent,
		NavigateContainerComponent,
		NavigateSectionContainerComponent,
		HomeComponent,
		ProfileComponent,
		WhereComponent,
		FieldsDropdownComponent,
		AgGridComponent,
		HtmlRendererComponent,
		RoutedLinkComponent,
		DateTimeComponent,
		RoutedIconComponent,
		ActionIconComponent,
		NotificationLinkComponent,
		IconValueComponent,
		FileArrayComponent,
		YesOrNoComponent,
		CheckboxComponent,
		IconDialogComponent,
		HeaderDialogComponent,
		DeleteDialogComponent,
		FindAndReplaceComponent,
		FindAndReplaceAngularComponent,
		InputComponent,
		CustomErrorDialogComponent,
		ClickOutsideDirective,
		ConditionWizardComponent,
		HeaderComponent,
		DatepickerComponent,
		DropdownEditComponent,
		FieldSelectorComponent,
		ParameterSelectorComponent,
  CustomColorPaletteComponent,
	],
	imports: [
		CommonModule,
		FormsModule,
		RouterModule,
		ReactiveFormsModule,
		HttpClientModule,
		MatIconModule,
		MatButtonModule,
		MatFormFieldModule,
		MatInputModule,
		MatToolbarModule,
		MatDialogModule,
		MatMenuModule,
		MatDividerModule,
		MatSnackBarModule,
		MatNativeDateModule,
		MatTooltipModule,
		MatListModule,
		MatProgressBarModule,
		MatDatepickerModule,
		MatSelectModule,
		MatProgressSpinnerModule,
		MatCardModule,
		MatSidenavModule,
		MatChipsModule,
		MatExpansionModule,
		MatTabsModule,
		DragDropModule,
		MatAutocompleteModule,
		MatCheckboxModule,
		TextFieldModule,
		MatTreeModule,
		MatBadgeModule,
		MatRadioModule,
		// CdkTreeModule,
		// our custom modules
		FilterSelectModule,
		DlDateTimeModule,
		agGridModule,
		DlDateTimeModule,
		CKEditorModule,
		FontAwesomeModule
	],
	providers: [
		TranslatePipe,
		SafePipe,
		LocaleDatePipe,
		HttpClientModule,
		HeaderDialogService,
		{ provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 3000, horizontalPosition: 'center', verticalPosition: 'top' } },
		{ provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { maxHeight: '90vh', maxWidth: '90vw', hasBackdrop: true, autoFocus: true } },
		{ provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline', hideRequiredMarker: false, floatLabel: 'always' } },
		{ provide: MAT_EXPANSION_PANEL_DEFAULT_OPTIONS, useValue: { collapsedHeight: '40px', expandedHeight: '40px' } },
	],
	exports: [
		CommonModule,
		DebugComponent,
		FormsModule,
		ReactiveFormsModule,
		FontAwesomeModule,
		MatIconModule,
		MatButtonModule,
		MatFormFieldModule,
		MatInputModule,
		MatToolbarModule,
		MatDialogModule,
		MatMenuModule,
		MatDividerModule,
		MatSnackBarModule,
		MatNativeDateModule,
		MatTooltipModule,
		MatListModule,
		MatProgressBarModule,
		MatDatepickerModule,
		MatSelectModule,
		MatProgressSpinnerModule,
		MatCardModule,
		MatSidenavModule,
		MatChipsModule,
		MatExpansionModule,
		MatTabsModule,
		DragDropModule,
		MatAutocompleteModule,
		MatCheckboxModule,
		MatTreeModule,
		MatBadgeModule,
		MatRadioModule,
		// CdkTreeModule,

		TextFieldModule,
		ErrorComponent,
		FileUploaderComponent,
		NavigateActionContainerComponent,
		NavigateContainerComponent,
		NavigateSectionContainerComponent,
		CustomErrorDialogComponent,
		HomeComponent,
		ProfileComponent,
		WhereComponent,
		FieldsDropdownComponent,
		FindAndReplaceComponent,
		FindAndReplaceAngularComponent,
		InputComponent,
		FieldSelectorComponent,
		ParameterSelectorComponent,
		FilterSelectModule,
		DlDateTimeModule,
		CustomColorPaletteComponent,

		TranslatePipe,
		SafePipe,
		ConfirmDialogComponent,
		ViewNotificationComponent,
		RecordFooterComponent,
		LocaleDatePipe,
		NativeElementDirective,
		CaseDirective,
		ClickOutsideDirective,
		AgGridComponent,
		DlDateTimeModule,
		NgxMatDatetimePickerModule,
		NgxMatTimepickerModule,
		NgxMatNativeDateModule,
		MatTableModule,
		CKEditorModule,
		HeaderComponent
	],
	schemas: [
		CUSTOM_ELEMENTS_SCHEMA,
		NO_ERRORS_SCHEMA
	],
	entryComponents: [CustomErrorDialogComponent]
})
export class SharedModule { }


