import { CommonModule } from '@angular/common';
import {
	CUSTOM_ELEMENTS_SCHEMA,
	NgModule,
	NO_ERRORS_SCHEMA
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DndModule } from 'ngx-drag-drop';

import { CKEditorModule } from 'ngx-ckeditor';
import { ColorPickerModule } from 'ngx-color-picker';
import { DropzoneModule } from 'ngx-dropzone-wrapper';
import { ConfirmationModalComponent } from './confirmation-modal/confirmation-modal.component';
import { GeneratedCodeModalComponent } from './generated-code-modal/generated-code-modal.component';


import { FontOptionsComponent } from './font-options/font-options.component';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';

import { CurrentElementComponent } from './drag-drop-content/elements/current-element/current-element.component';
import { FormDesignPropertyComponent } from './drag-drop-content/elements/form-design-property/form-design-property.component';

import { InputComponent } from './drag-drop-content/elements/input/input.component';
import { RadiosComponent } from './drag-drop-content/elements/radios/radios.component';
import { DropdownComponent } from './drag-drop-content/elements/dropdown/dropdown.component';
import { CheckboxComponent } from './drag-drop-content/elements/checkbox/checkbox.component';
import { TextComponent } from './drag-drop-content/elements/text/text.component';
import { TextareaComponent } from './drag-drop-content/elements/textarea/textarea.component';
import { SpacerComponent } from './drag-drop-content/elements/spacer/spacer.component';
import { ButtonComponent } from './drag-drop-content/elements/button/button.component';
import { UploaderComponent } from './drag-drop-content/elements/uploader/uploader.component';
import { PictureComponent } from './drag-drop-content/elements/picture/picture.component';

import { InputPropertyComponent } from './drag-drop-content/elements/input-property/input-property.component';
import { RadiosPropertyComponent } from './drag-drop-content/elements/radios-property/radios-property.component';
import { DropdownPropertyComponent } from './drag-drop-content/elements/dropdown-property/dropdown-property.component';
import { CheckboxPropertyComponent } from './drag-drop-content/elements/checkbox-property/checkbox-property.component';
import { TextPropertyComponent } from './drag-drop-content/elements/text-property/text-property.component';
import { TextareaPropertyComponent } from './drag-drop-content/elements/textarea-property/textarea-property.component';
import { SpacerPropertyComponent } from './drag-drop-content/elements/spacer-property/spacer-property.component';
import { ButtonPropertyComponent } from './drag-drop-content/elements/button-property/button-property.component';
import { UploaderPropertyComponent } from './drag-drop-content/elements/uploader-property/uploader-property.component';
import { PicturePropertyComponent } from './drag-drop-content/elements/picture-property/picture-property.component';

import { PinnedPanelComponent } from './panel/pinned-panel/pinned-panel.component';

import { A11yModule } from '@angular/cdk/a11y';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { DialogModule } from '@angular/cdk/dialog';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CdkListboxModule } from '@angular/cdk/listbox';
import { CdkMenuModule } from '@angular/cdk/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CdkStepperModule } from '@angular/cdk/stepper';
import { CdkTableModule } from '@angular/cdk/table';
import { CdkTreeModule } from '@angular/cdk/tree';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { SharedModule } from '../../../../app/shared/shared.module';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		NgbModule,
		DndModule,
		CKEditorModule,
		ColorPickerModule,
		DropzoneModule,
		A11yModule,
		CdkAccordionModule,
		ClipboardModule,
		CdkListboxModule,
		CdkMenuModule,
		CdkStepperModule,
		CdkTableModule,
		CdkTreeModule,
		DragDropModule,
		MatAutocompleteModule,
		MatBadgeModule,
		MatBottomSheetModule,
		MatButtonModule,
		MatButtonToggleModule,
		MatCardModule,
		MatCheckboxModule,
		MatChipsModule,
		MatStepperModule,
		MatDatepickerModule,
		MatDialogModule,
		MatDividerModule,
		MatExpansionModule,
		MatGridListModule,
		MatIconModule,
		MatInputModule,
		MatListModule,
		MatMenuModule,
		MatNativeDateModule,
		MatPaginatorModule,
		MatProgressBarModule,
		MatProgressSpinnerModule,
		MatRadioModule,
		MatRippleModule,
		MatSelectModule,
		MatSidenavModule,
		MatSliderModule,
		MatSlideToggleModule,
		MatSnackBarModule,
		MatSortModule,
		MatTableModule,
		MatTabsModule,
		MatToolbarModule,
		MatTooltipModule,
		MatTreeModule,
		OverlayModule,
		PortalModule,
		ScrollingModule,
		DialogModule,
		SharedModule
	],
	exports: [
		SafeHtmlPipe,
		FontOptionsComponent,
		PinnedPanelComponent,
		CurrentElementComponent,
		
		InputComponent,
		RadiosComponent,
		DropdownComponent,
		CheckboxComponent,
		TextComponent,
		TextareaComponent,
		SpacerComponent,
		ButtonComponent,
		UploaderComponent,
		PictureComponent,
		
		InputPropertyComponent,
		RadiosPropertyComponent,
		DropdownPropertyComponent,
		CheckboxPropertyComponent,
		TextPropertyComponent,
		TextareaPropertyComponent,
		SpacerPropertyComponent,
		ButtonPropertyComponent,
		UploaderPropertyComponent,
		PicturePropertyComponent,
		
		MatExpansionModule,
		MatAutocompleteModule,
		MatBadgeModule,
		MatBottomSheetModule,
		MatButtonModule,
		MatButtonToggleModule,
		MatCardModule,
		MatCheckboxModule,
		MatChipsModule,
		MatStepperModule,
		MatDatepickerModule,
		MatDialogModule,
		MatDividerModule,
		MatExpansionModule,
		MatGridListModule,
		MatIconModule,
		MatInputModule,
		MatListModule,
		MatMenuModule,
		MatNativeDateModule,
		MatPaginatorModule,
		MatProgressBarModule,
		MatProgressSpinnerModule,
		MatRadioModule,
		MatRippleModule,
		MatSelectModule,
		MatSidenavModule,
		MatSliderModule,
		MatSlideToggleModule,
		MatSnackBarModule,
		MatSortModule,
		MatTableModule,
		MatTabsModule,
		MatToolbarModule,
		MatTooltipModule,
		MatTreeModule,
		FormDesignPropertyComponent,
	],
	declarations: [
		SafeHtmlPipe,
		FontOptionsComponent,
		ConfirmationModalComponent,
		GeneratedCodeModalComponent,
		CurrentElementComponent,
		
		InputComponent,
		RadiosComponent,
		DropdownComponent,
		CheckboxComponent,
		TextComponent,
		TextareaComponent,
		SpacerComponent,
		ButtonComponent,
		UploaderComponent,
		PictureComponent,
		
		InputPropertyComponent,
		RadiosPropertyComponent,
		DropdownPropertyComponent,
		CheckboxPropertyComponent,
		TextPropertyComponent,
		TextareaPropertyComponent,
		SpacerPropertyComponent,
		ButtonPropertyComponent,
		UploaderPropertyComponent,
		PicturePropertyComponent,
		
		PinnedPanelComponent,
		FormDesignPropertyComponent,
	],
	providers: [],
	schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class SharedModuleForm {}
