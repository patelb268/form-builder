export interface InputInterface {
  label: string;
  report_label: string;
  field_name: null | string;
  is_required: boolean;
  show_label: boolean;
  placeholder_text: string;
  default_value: string;
  default_value_type: any;
  sub_label: any;
  validation: any;
  size: number;
  max_size: number;
}
