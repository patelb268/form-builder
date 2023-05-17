import { Component, Input, OnInit, ViewContainerRef } from '@angular/core';
import { UUID } from 'angular2-uuid';

@Component({
  selector: 'app-pinned-panel',
  templateUrl: './pinned-panel.component.html',
  styleUrls: ['./pinned-panel.component.scss']
})
export class PinnedPanelComponent implements OnInit {
  @Input() selectedComponent: any;
  @Input() formDesign: any;
  constructor(public vcRef: ViewContainerRef) { }
	mapOptionValueToId : object = {};
	@Input() selectedOptionId : string;
	selectedSpecialOption : string = "none";

  ngOnInit(): void {
  }

  onDefaultValueTypeChange() {
    if(this.selectedComponent.element.default_value_type !== "previous"){
      this.selectedComponent.element.default_value = "";
    }
  }
  changeSelectedOption(event) {
		let selectOptionId = event.value;
		this.selectedComponent.element.options.map((option) => option.is_selected = option.id === selectOptionId);
		this.selectedComponent.selectedOptionId = selectOptionId;
	}

  updateOptionList() {
		let optinsTextareaArray = this.selectedComponent.optionsTextarea.split('\n');
		let optionArray = [];
		optinsTextareaArray.forEach((option) => {
			if (option.trim().length > 0) {
				optionArray.push({
					id: this.mapOptionValueToId[option.trim()] || UUID.UUID(),
					text: option.split(',')[0],
					value: option.split(',')[1],
					is_selected: (this.selectedComponent.selectedOptionId === this.mapOptionValueToId[option.trim()])
				})
			}
		});
		this.selectedComponent.element.options = optionArray;
	}

}
