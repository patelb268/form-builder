export interface FormDesignInterface {
	fullWidth: boolean;
	width: number;
	height: number;
	background_color: string;
	container_background_color: string;
	text_color: string;
	font_family: string;
	font_size: number;
	rounded_corners: number;
	page_paddings: number;
	form_paddings: number;
	field_rounded_corners: number;
	form_border_width: number;
	form_border_color: string;
	field_background_color: string;
	field_border_width: number;
	field_border_color: string;
	label_width: number,
	label_font_color: string;
	label_font_size: number;
	label_font_bold: boolean;
	label_font_italic: boolean;
	field_size: 's' | 'm' | 'l';
	page_alignment: 'top' | 'center' | 'bottom';
	label_alignment: 'top' | 'left' | 'auto' | 'top';
	spread_columns: string;
}
