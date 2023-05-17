export interface TextareaInterface {
	label: string;
	report_label: string;
	field_name: null | string;
	is_required: boolean;
	show_label: boolean;
	placeholder_text: string;
	default_value: string;
	default_value_type: 'constant' | 'formula' | 'previous';
	sub_label: string;
	hover_text: string;
	validation:
		| 'none'
		| 'email'
		| 'phone'
		| 'extension'
		| 'alphaNumeric'
		| 'alphabetic';
	size: number;
	textColor: string;
	read_only: 'yes' | 'no';
	show_history: 'yes' | 'no';
	append: 'yes' | 'no';
	encrypt_data: 'yes' | 'no';
	do_not_duplicate: 'yes' | 'no';
	align_label: 'auto' | 'top' | 'left' | 'right';
	add_css: 'yes' | 'no';
	hide: 'yes' | 'no';
}
