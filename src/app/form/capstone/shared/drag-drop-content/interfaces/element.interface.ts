import { ComponentSettingInterface } from './component-setting.interface';
import { MultipleSelectInterface } from './multiple-select.interface';

import { ButtonInterface } from './button.interface';
import { CheckboxInterface } from './checkbox.interface';
import { InputInterface } from './input.interface';
import { PictureInterface } from './picture.interface';
import { RadioInterface } from './radio.interface';
import { SpacerInterface } from './spacer.interface';
import { TextInterface } from './text.interface';
import { TextareaInterface } from './textarea.interface';
import { UploaderInterface } from './uploader.interface';

export interface ElementInterface {
	id?: string;
	name: string;
	machineName:
		| 'section'
		| 'input'
		| 'radios'
		| 'dropdown'
		| 'checkbox'
		| 'text'
		| 'textarea'
		| 'picture'
		| 'button'
		| 'uploader'
		| 'spacer';

	iconClass?: string;
	matIconName?: string;
	image?: string;
	column?: string;
	addedComponents: Array<ElementInterface[]>;
	element?:
		| ButtonInterface
		| CheckboxInterface
		| MultipleSelectInterface
		| TextInterface
		| TextareaInterface
		| InputInterface
		| SpacerInterface
		| PictureInterface
		| UploaderInterface
		| RadioInterface;
	// buttons?: Array<SocialIconInterface>;
	deletable?: boolean;
	type?: 'text' | 'email' | 'number' | 'date' | 'datetime';
	isSelected?: boolean;
	componentSettings?: ComponentSettingInterface;
	pinData: Array<string>;
	readonly?: boolean;
	hideElement?: string;
}
