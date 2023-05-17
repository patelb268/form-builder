export interface CheckboxInterface {
  label: string;
  report_label: string;
  field_name: null | string;
  is_required: boolean;
  show_label: boolean;
  placeholder_text: string;
  default_value: string;
  default_value_type: any;
  sub_label: any;
  show_element: boolean;
  optionsTextarea : string;
  selectedOptionId : string;
  check_align: 'before' | 'after';
  label_width: number;
  allow_other: boolean;
}
