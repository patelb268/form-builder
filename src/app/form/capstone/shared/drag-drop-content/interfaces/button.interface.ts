export interface ButtonInterface {
  content: string;
  link_to: string;
  button_type: string;
  button_style: 'flat' | 'raised' | '';
  button_color: string;
  text_color: string;
  rounded_corners: number;
  button_size_type: 'auto' | 'full-width' | 'fixed';
  button_size: number;
  font_family: string;
  font_size: number;
  font_bold: boolean;
  font_italic: boolean;
  line_height: number;
  height: number;
  alignment: 'left' | 'right' | 'center';
  vertical_align: 'top' | 'middle' | 'bottom';
  box_shadow_color: string;
  gradient_top_color: string;
  gradient_bottom_color: string;
}
