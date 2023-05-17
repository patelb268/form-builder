export interface PictureInterface {
  image_url:  string;
  image_link: string;
  alignment: 'left' | 'right' | 'center';
  alt_text: string;
  width: number;
  label: string;
  report_label: string;
}
