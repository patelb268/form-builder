import { FormDesignInterface } from "./form-design.interface";

interface FormDragAndDropInterface {
    added_components: Array<any>;
    form_design: FormDesignInterface;
}

export interface FormInterface {
  content_dnd: FormDragAndDropInterface;
}
