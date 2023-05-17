import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DndModule } from 'ngx-drag-drop';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ColorPickerModule } from 'ngx-color-picker';
import { SharedModuleForm } from '../shared/shared.module';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';



import { FormBuilderComponent } from './form-builder.component';

@NgModule({
    declarations: [FormBuilderComponent],
    imports: [
        CommonModule,
        FormsModule,
        DndModule,
        NgbModule,
        SharedModuleForm,
        ColorPickerModule,
        MatToolbarModule,
        MatIconModule,

    ],
    providers: [],
    schemas: [
        CUSTOM_ELEMENTS_SCHEMA,
        NO_ERRORS_SCHEMA
    ]
})
export class FormBuilderModule {}
