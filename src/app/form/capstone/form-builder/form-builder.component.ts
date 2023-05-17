import {
	Component,
	OnDestroy,
	OnInit,
	ViewChild,
	ViewContainerRef
} from '@angular/core';
import { NgbModal, NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { UUID } from 'angular2-uuid';
import * as _ from 'lodash';
import { DndDropEvent } from 'ngx-drag-drop';
import { GeneratedCodeModalComponent } from '../shared/generated-code-modal/generated-code-modal.component';
import { ConfirmationModalComponent } from '../shared/confirmation-modal/confirmation-modal.component';
import { ComponentSettingInterface } from '../shared/drag-drop-content/interfaces/component-setting.interface';
import { ElementInterface } from '../shared/drag-drop-content/interfaces/element.interface';
import { FormInterface } from '../shared/drag-drop-content/interfaces/form.interface';

const componentAttributesToAPIparametersMap = {
	//General Settings
	label: 'text',
	report_label: 'reportLabel',
	id: 'id',
	is_required: 'required',
	validation: 'validation',
	default_value: 'defaultValue',
	default_value_type: 'defaultValueType',
	sub_label: 'subLabel',
	hover_text: 'description',

	//Style Settings
	align_label: 'labelAlign',
	size: 'size',
	max_size: 'maxsize',
	placeholder_text: 'hint',
	css: 'css',
	hide: 'hide',
	password: 'password',
	case: 'changecase',

	//Advanced Settings
	read_only: 'readOnly',
	show_history: 'histroy',
	append: 'append',
	unique: 'unique',
	protected: 'protectedColumn',
	encrypt_data: 'encrypt',
	do_not_duplicate: 'doNotDuplicate'
};

@Component({
	selector: 'app-form-builder',
	templateUrl: './form-builder.component.html',
	styleUrls: ['./form-builder.component.scss']
})

export class FormBuilderComponent implements OnInit, OnDestroy {
	@ViewChild('popover') popover!: NgbPopover;

	/**
	 * Array for containing dropped components in a form
	 */
	addedComponents!: Array<ElementInterface>;

	/**
	 * Object for containing drag & drop form
	 */
	subscriptionForm: FormInterface = {
		content_dnd: {
			added_components: [],
			form_design: {
				fullWidth: false,
				width: 800,
				height: 0,
				page_alignment: 'top',
				background_color: '#f5f5f5',
				container_background_color: '#ffffff',
				text_color: '#000000',
				font_family: "'Helvetica Neue', Helvetica, sans-serif",
				font_size: 16,
				rounded_corners: 8,
				page_paddings: 15,
				form_paddings: 15,
				field_rounded_corners: 5,
				form_border_width: 1,
				form_border_color: '#ced4da',
				field_background_color: '#ffffff',
				field_border_width: 1,
				field_border_color: '#ced4da',
				label_font_color: '#000000',
				label_width: 200,
				label_font_size: 14,
				label_font_bold: false,
				label_font_italic: false,
				field_size: 'm',
				label_alignment: 'auto',
				spread_columns: '1'
			}
		}
	};

	/**
	 * Property for containing which tab is activated
	 * 1: Current Element
	 * 2: Form Design
	 */
	public activeTab = 2;

	/**
	 * Array for containing only section components
	 */
	public sectionComponents: Array<ElementInterface> = [];

	/**
	 * Array for containing components except section component
	 */
	public components: Array<ElementInterface> = [];

	/**
	 * Property for containing class name when dragging element
	 */
	public dragStartClass: string = '';

	/**
	 * Object for containing current selected component
	 */
	public selectedComponent!: null | ElementInterface;

	/**
	 * Object for containing component setting properties
	 */
	protected componentSettings: ComponentSettingInterface = {
		background_color: '',
		rounded_corners: 0,
		padding_top: 20,
		padding_right: 0,
		padding_bottom: 10,
		padding_left: 0,
		height: 0
	};

	/**
	 * Current language ISO code
	 */
	public currentLanguage: string = '';

	constructor(
		public vcRef: ViewContainerRef,
		private modalService: NgbModal,
		// private formBuilderService: FormBuilderService
	) {}

	/**
	 * On Init handler
	 */
	ngOnInit() {
		document.body.classList.add('drag-drop-page');

		this.components = [
			{
				name: 'Input',
				machineName: 'input',
				iconClass: 'far fa-square fa-2x',
				matIconName: 'input',
				addedComponents: [],
				element: {
					label: 'Input label',
					report_label: 'Input label',
					field_name: null,
					is_required: false,
					show_label: true,
					default_value: '',
					default_value_type: '',
					validation: '',
					placeholder_text: 'Placeholder text',
					sub_label: '',
					size: 770,
					max_size: 770
				},
				deletable: true,
				readonly: false,
				hideElement: 'no',
				type: 'text',
				pinData: []
			},
			{
				name: 'Dropdown',
				machineName: 'dropdown',
				iconClass: 'far fa-caret-square-down fa-2x',
				matIconName: 'list_alt',
				addedComponents: [],
				element: {
					label: 'Dropdown label',
					options: [
						{
							id: UUID.UUID(),
							text: 'Value 1',
							value: '100',
							is_selected: true
						},
						{
							id: UUID.UUID(),
							text: 'Value 2',
							value: '101',
							is_selected: false
						},
						{
							id: UUID.UUID(),
							text: 'Value 3',
							value: '102',
							is_selected: false
						}
					],
					is_required: false,
					show_label: true,
					field_name: null
				},
				deletable: true,
				pinData: []
			},
			{
				name: 'Radio Buttons',
				machineName: 'radios',
				iconClass: 'fas fa-list-ul fa-2x',
				matIconName: 'radio_button_checked',
				addedComponents: [],
				element: {
					label: 'Radio buttons label',
					report_label: 'Radio buttons label',
					options: [
						{
							id: UUID.UUID(),
							text: 'Value 1',
							value: '100',
							is_selected: true
						},
						{
							id: UUID.UUID(),
							text: 'Value 2',
							value: '101',
							is_selected: false
						},
						{
							id: UUID.UUID(),
							text: 'Value 3',
							value: '102',
							is_selected: false
						}
					],
					default_value_type: 'constant',
					allow_other: false,
					is_required: false,
					show_label: true,
					field_name: null,
					optionsTextarea: '',
					selectedOptionId: '',
					check_align: 'after',
					label_width: 140
				},
				deletable: true,
				pinData: []
			},
			{
				name: 'Checkbox',
				machineName: 'checkbox',
				iconClass: 'far fa-check-square fa-2x',
				matIconName: 'check_box',
				addedComponents: [],
				element: {
					label: 'Checkbox label',
					options: [
						{
							id: UUID.UUID(),
							text: 'Value 1',
							value: '100',
							is_selected: true
						},
						{
							id: UUID.UUID(),
							text: 'Value 2',
							value: '101',
							is_selected: false
						},
						{
							id: UUID.UUID(),
							text: 'Value 3',
							value: '102',
							is_selected: false
						}
					],
					default_value_type: 'constant',
					allow_other: false,
					is_required: false,
					show_label: true,
					field_name: null,
					optionsTextarea: '',
					selectedOptionId: '',
					check_align: 'after',
					label_width: 140
				},
				deletable: true,
				pinData: []
			},
			{
				name: 'Textarea',
				machineName: 'textarea',
				iconClass: 'fas fa-language fa-2x',
				matIconName: 'subject',
				addedComponents: [],
				element: {
					label: 'Textarea label',
					report_label: 'Textarea label',
					field_name: null,
					is_required: false,
					show_label: true,
					default_value: '',
					default_value_type: 'constant',
					validation: 'none',
					placeholder_text: 'Placeholder text',
					sub_label: '',
					hover_text: '',
					size: 800,
					textColor: '#000000',
					read_only: 'no',
					show_history: 'no',
					append: 'no',
					encrypt_data: 'no',
					do_not_duplicate: 'no',
					align_label: 'auto',
					add_css: 'no',
					hide: 'no'
				},
				deletable: true,
				pinData: []
			},
			{
				name: 'Image',
				machineName: 'picture',
				iconClass: 'far fa-image fa-2x',
				matIconName: 'image',
				addedComponents: [],
				element: {
					label: 'Add Image',
					report_label: 'Image label',
					image_url: '',
					image_link: '',
					alignment: 'center',
					alt_text: '',
					width: 100,
					height: 100
				},
				deletable: true,
				pinData: []
			},
			{
				name: 'Spacer',
				machineName: 'spacer',
				iconClass: 'fas fa-arrows-alt-v fa-2x',
				matIconName: 'check_box_outline_blank',
				addedComponents: [],
				element: {
					height: 30
				},
				deletable: true,
				pinData: []
			},
			{
				name: 'Uploader',
				machineName: 'uploader',
				iconClass: 'fas fa-upload fa-2x',
				matIconName: "upload",
				addedComponents: [],
				element: {
					field_name: null,
					upload_url: 'https://example.com/upload-handler',
					accepted_files: 'image/*',
					max_file_size: 2,
					placeholder: 'Click or drag images here to upload',
					line_height: 1.5,
					text_color: null,
					font_family: "'Helvetica Neue', Helvetica, sans-serif",
					font_size: 16,
					border_style: 'dashed',
					border_color: '#c7c3c3',
					border_width: 3,
					width_type: 'full-width',
					width: 150,
					alignment: 'center'
				},
				deletable: true,
				pinData: []
			},
			{
				name: 'Button',
				machineName: 'button',
				iconClass: 'fas fa-square fa-2x',
				matIconName: 'smart_button',
				addedComponents: [],
				element: {
					content: 'Button',
					link_to: '',
					button_type: 'button',
					button_style: '',
					button_color: '#0143a3',
					text_color: '#FFFFFF',
					rounded_corners: 0,
					button_size_type: 'auto',
					button_size: 100,
					font_family: "'Helvetica Neue', Helvetica, sans-serif",
					font_size: 16,
					font_bold: false,
					font_italic: false,
					line_height: 1.5,
					height: 30,
					alignment: 'center',
					vertical_align: 'middle',
					box_shadow_color: '',
					gradient_top_color: '',
					gradient_bottom_color: ''
				},
				deletable: true,
				type: 'text',
				pinData: []
			}
		];
	}

	/**
	 * On destroy handler
	 */
	ngOnDestroy() {
		document.body.classList.remove('drag-drop-page');
	}

	/**
	 * On drag start event handler
	 *
	 * @param event
	 */
	onDragStart(event: DragEvent) {
		this.dragStartClass = 'bg-light';
	}

	/**
	 * On dragged event handler
	 *
	 * @param item
	 * @param list
	 * @param effect
	 */
	onDragged(
		item: ElementInterface,
		list: Array<ElementInterface>,
		effect: string
	) {
		if (effect === 'move') {
			const index = list.findIndex((i: any) => {
				if (item.id && item.id === i.id) {
					return true;
				}

				return false;
			});

			list.splice(index, 1);
		}
	}

	/**
	 * On drag end event handler
	 *
	 * @param event
	 */
	onDragEnd(event: DragEvent) {
		this.dragStartClass = '';
	}

	/**
	 * On dropped event hanlder
	 *
	 * @param event
	 * @param list
	 * @returns
	 */
	onDrop(event: DndDropEvent, list: Array<ElementInterface>) {
		this.closePopover();

		if (['copy', 'move'].indexOf(event.dropEffect) === -1) {
			return false;
		}

		let index = event.index;

		if (typeof index === 'undefined') {
			index = list.length;
		}

		// Reset selected state
		this.resetAllSelectedState();

		const component = _.clone(event.data);
		component.isSelected = true;
		component.id = UUID.UUID();

		if (
			[
				'radios',
				'dropdown',
				'input',
				'checkbox',
				'textarea',
				'uploader'
			].includes(component.machineName)
		) {
			component.element.field_name = `${
				component.machineName
			}-${component.id.split('-').shift()}`;
		}

		if (
			component.machineName === 'radios' ||
			component.machineName === 'dropdown' ||
			component.machineName === 'checkbox'
		) {
			for (let option of component.element.options) {
				option.id = UUID.UUID();
			}
		}

		if (!component.hasOwnProperty('componentSettings')) {
			component.componentSettings = _.clone(this.componentSettings);
		}

		this.selectedComponent = component;
		list.splice(index, 0, component);

		this.activeTab = 1;

		return true;
	}

	/**
	 * Set component as selected
	 *
	 * @param $event
	 * @param component
	 */
	setSelectedComponent($event: any, component: ElementInterface) {
		$event.stopPropagation();
		this.resetAllSelectedState();
		component.isSelected = true;
		this.selectedComponent = component;

		this.activeTab = 1;
	}

	/**
	 * Reset all selected elements's state
	 */
	resetAllSelectedState() {
		this.subscriptionForm.content_dnd.added_components.forEach((c: any) => {
			c.isSelected = false;

			if (c.addedComponents.length > 0) {
				c.addedComponents.forEach((cc: Array<any>) => {
					cc.forEach((ccc) => {
						ccc.isSelected = false;
					});
				});
			}
		});
	}

	/**
	 * Delete selected component
	 *
	 * @param $event
	 * @param id
	 */
	deleteComponent($event: any, id: string) {
		$event.stopPropagation();

		const modalConfirm = this.modalService.open(
			ConfirmationModalComponent,
			{
				centered: true
			}
		);

		modalConfirm.componentInstance.title = 'Delete confirmation';
		modalConfirm.componentInstance.message =
			'Are you sure, that you want to delete this element?';

		modalConfirm.result.then(
			(result) => {
				if (result === 'OK_CLICK') {
					let index = -1;
					for (let c of this.subscriptionForm.content_dnd
						.added_components) {
						index++;
						if (c.id === id) {
							this.subscriptionForm.content_dnd.added_components.splice(
								index,
								1
							);
							break;
						}

						if (c.addedComponents.length) {
							for (let cc of c.addedComponents) {
								let cIndex = _.findIndex(cc, { id: id });

								if (cIndex > -1) {
									cc.splice(cIndex, 1);
									break;
								}
							}
						}
					}

					this.selectedComponent = null;
				}
			},
			(reason) => {}
		);
	}

	/**
	 * Close Add section popup
	 */
	closePopover() {
		if (this.popover.isOpen()) this.popover.close();
	}

	
	/**
   * Convert JSON for Auxilium format
   *
   * @return string
   */
	produceJSON(formPropertyComponent: FormInterface) {
		let count = 1000;
		let startIndex = 1;
		let apiParametersObj = {};
		formPropertyComponent.content_dnd.added_components.forEach(
			(added_component: ElementInterface) => {
				count = 1000 + startIndex;
				for (const [key, value] of Object.entries(
					added_component.element
				)) {
					let tempAPIObjKey =
						componentAttributesToAPIparametersMap[key];
					if(tempAPIObjKey) {
						apiParametersObj[`${count}_${tempAPIObjKey}`] = value;
					}
					else {
						apiParametersObj[`${count}_${key}`] = value;
					}
					
				}
				apiParametersObj[`${count}_qid`] = count;
				apiParametersObj[`${count}_order`] = startIndex;
				apiParametersObj[`${count}_pinItems`] = added_component.pinData;
				// if (added_component.machineName === 'input') {
				// 	apiParametersObj[`${count}_name`] = 'Input label';
				// 	apiParametersObj[`${count}_type`] = 'control_textbox';
				// 	apiParametersObj[`${count}_dateTime`] = 'Yes';
				// 	apiParametersObj[`${count}_user`] = 'Yes';
				// 	apiParametersObj[`${count}_showAudit`] = 'No';
				// }
				startIndex += 1;
			}
		);

		// Append form properties
		apiParametersObj['form_height'] = 672;
		apiParametersObj['form_title'] = 'Test';
		apiParametersObj['form_styles'] = 'form';
		apiParametersObj['form_font'] =
			formPropertyComponent.content_dnd.form_design.font_family;
		apiParametersObj['form_fontsize'] =
			formPropertyComponent.content_dnd.form_design.font_size;
		apiParametersObj['form_fontcolor'] =
			formPropertyComponent.content_dnd.form_design.text_color;
		apiParametersObj['form_lineSpacing'] = '5';
		apiParametersObj['form_background'] =
			formPropertyComponent.content_dnd.form_design.background_color;
		apiParametersObj['form_formWidth'] =
			formPropertyComponent.content_dnd.form_design.width;
		apiParametersObj['form_formHeight'] =
			formPropertyComponent.content_dnd.form_design.height;
		apiParametersObj['form_labelWidth'] =
			formPropertyComponent.content_dnd.form_design.label_width;
		apiParametersObj['form_alignment'] =
			formPropertyComponent.content_dnd.form_design.label_alignment;
		apiParametersObj['form_thankurl'] = '';
		apiParametersObj['form_thanktext'] = '';
		apiParametersObj['form_highlightLine'] = 'Enabled';
		apiParametersObj['form_activeRedirect'] = 'default';
		apiParametersObj['form_sendpostdata'] = 'No';
		apiParametersObj['form_attachJs'] = '';
		apiParametersObj['form_unique'] = 'None';
		apiParametersObj['form_offline'] = 'No';
		apiParametersObj['form_status'] = 'Enabled';
		apiParametersObj['form_hideUnavailable'] = 'No';
		apiParametersObj['form_injectCSS'] = '';
		apiParametersObj['form_hideApp'] = '';
		apiParametersObj['form_mobileInitialScale'] = '100';
		apiParametersObj['form_mobileMaximumScale'] = '200';
		apiParametersObj['form_mobileUserScale'] = 'Yes';
		apiParametersObj['form_singleItem'] = '';
		apiParametersObj['form_multipleItem'] = '';
		apiParametersObj['form_formStrings'] = [
			{
				required: 'This field is required.',
				alphabetic: 'This field can only contain letters',
				numeric: 'This field can only contain numeric values',
				alphanumeric:
					'This field can only contain letters and numbers.',
				incompleteFields:
					'There are incomplete required fields. Please complete them.',
				uploadFilesize: 'File size cannot be bigger than:',
				confirmClearForm: 'Are you sure you want to clear the form',
				lessThan: 'Your score should be less than',
				email: 'Enter a valid e-mail address',
				uploadExtensions: 'You can only upload following files:',
				pleaseWait: 'Please wait...'
			}
		];
		apiParametersObj['form_emails'] = [];
		apiParametersObj['form_templates'] = [];
		apiParametersObj['form_style'] = 'Default';
		apiParametersObj['form_theme'] = 'Default';
		apiParametersObj['form_header'] = '';
		apiParametersObj['form_footer'] = '';
		apiParametersObj['form_sendEmail'] = 'Yes';
		apiParametersObj['form_cloned'] = 0;

		return apiParametersObj;
	}

	
	/**
   * Generate form builder to JSON code
   *
   * @return string
   */
	generateJson() {
		let finalJson = this.produceJSON(this.subscriptionForm);
		console.log(typeof finalJson);
		console.log(typeof this.subscriptionForm.content_dnd);
		
		const modalRef = this.modalService.open(GeneratedCodeModalComponent, {
		  size: 'lg',
		});
		modalRef.componentInstance.title = 'JSON code';
		modalRef.componentInstance.content = JSON.stringify(
			finalJson,
		  null,
		  2
		);
	}

	updatePin(data: any) {
		let listOfElements = this.subscriptionForm.content_dnd.added_components;
		let machineName = data.component.machineName;
		if (data.value == 'add') {
			listOfElements.forEach((ele) => {
				if (ele.machineName == machineName) {
					if (!ele.pinData.includes(data.pinType)) {
						if (ele.pinData.length < 10) {
							ele.pinData.push(data.pinType);
							this.components.forEach((comp) => {
								if (
									comp.machineName == machineName &&
									!comp.pinData.includes(data.pinType)
								) {
									comp.pinData.push(data.pinType);
								}
							});
						} else {
							alert('Max 10 pins are allowed.');
						}
					}
				}
			});
		}
		if (data.value == 'remove') {
			listOfElements.forEach((ele) => {
				if (ele.machineName == machineName) {
					ele.pinData = ele.pinData.filter(
						(ele) => ele !== data.pinType
					);
					this.components.forEach((ele) => {
						if (ele.machineName == machineName) {
							ele.pinData = ele.pinData.filter(
								(ele) => ele !== data.pinType
							);
						}
					});
				}
			});
		}
	}

	resizableElement: any;
	drag_handler: any;
	drag_handler_width: number;
	original_width: number;
	form_width: number;
	original_x: number;
	original_mouse_x: number;
	isMouseDown: boolean;

	resizeParentOnMouseDown(event) {
		event.preventDefault();
		this.isMouseDown = true;
		this.resizableElement = event.target.parentElement;
		this.drag_handler =
			this.resizableElement.querySelector('#drag-handler');
		this.drag_handler_width = parseFloat(
			getComputedStyle(this.drag_handler, null)
				.getPropertyValue('width')
				.replace('px', '')
		);
		this.form_width = parseFloat(
			getComputedStyle(document.getElementById('form-container'), null)
				.getPropertyValue('width')
				.replace('px', '')
		);

		this.original_width = parseFloat(
			getComputedStyle(this.resizableElement, null)
				.getPropertyValue('width')
				.replace('px', '')
		);
		this.original_x = this.resizableElement.getBoundingClientRect().left;
		this.original_mouse_x = event.pageX;
	}

	resizeParentOnMouseMove(event) {
		event.preventDefault();
		if (this.isMouseDown) {
			this.resize(event);
		}
	}

	resizeOnMouseMove(event) {
		event.preventDefault();
		event.stopPropagation();
		let id = event.target.id;
		if (id !== 'resize-handler') {
			if (this.isMouseDown) {
				event.target.style.cursor = 'ew-resize';
				this.resize(event);
			} else {
				event.target.style.cursor = 'default';
			}
		}
	}

	resizeOnMouseUp(event) {
		event.preventDefault();
		this.isMouseDown = false;
	}

	resize(event) {
		let width = this.original_width + (event.pageX - this.original_mouse_x);
		if (width < 20) {
			width = 20;
		} else if (width > this.form_width) {
			width = this.form_width;
		}
		this.resizableElement.style.width = width + 'px';

		// this.adjustDragHandlerPosition(width);
	}

	adjustDragHandlerPosition(width: number) {
		this.drag_handler.style.left =
			width / 2 - this.drag_handler_width / 2 + 'px';
	}
}
