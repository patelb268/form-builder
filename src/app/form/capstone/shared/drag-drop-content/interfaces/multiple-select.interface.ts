interface OptionInterface {
  id: string;
  text: string;
  value: string;
  is_selected: boolean;
}

export interface MultipleSelectInterface {
  label: string;
  field_name: null | string;
  is_required: boolean;
  show_label: boolean;
  options: Array<OptionInterface>;
}
