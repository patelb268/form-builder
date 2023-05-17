import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DropdownPropertyComponent } from './dropdown-property.component';
import { UUID } from 'angular2-uuid';
import * as _ from 'lodash';

describe('DropdownPropertyComponent', () => {
  let component: DropdownPropertyComponent;
  let fixture: ComponentFixture<DropdownPropertyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DropdownPropertyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DropdownPropertyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should set varcharAttributes to an array of attributes with type varchar', () => {
    const attributes = [
      { name: 'attr1', type: 'varchar' },
      { name: 'attr2', type: 'text' },
      { name: 'attr3', type: 'varchar' }
    ];
    component.attributes = attributes;
    expect(component.varcharAttributes.length).toBe(2);
    expect(component.varcharAttributes[0].name).toBe('attr1');
    expect(component.varcharAttributes[1].name).toBe('attr3');
  });

  it('should add an option to component.element.options when addOption is called', () => {
    const initialLength = component.element.options.length;
    component.addOption();
    expect(component.element.options.length).toBe(initialLength + 1);
    const newOption = component.element.options[initialLength];
    expect(newOption.id).toBeTruthy();
    expect(newOption.text).toBe(`Option ${initialLength + 1}`);
    expect(newOption.value).toBe(`Value ${initialLength + 1}`);
    expect(newOption.is_selected).toBe(false);
  });

  it('should remove an option from component.element.options when removeOption is called with an optionId', () => {
    const optionId = UUID.UUID();
    component.element.options = [
      { id: UUID.UUID(), text: 'Option 1', value: 'Value 1', is_selected: true },
      { id: optionId, text: 'Option 2', value: 'Value 2', is_selected: false },
      { id: UUID.UUID(), text: 'Option 3', value: 'Value 3', is_selected: false }
    ];
    const initialLength = component.element.options.length;
    component.removeOption(optionId);
    expect(component.element.options.length).toBe(initialLength - 1);
    expect(component.element.options.some(option => option.id === optionId)).toBe(false);
  });

  it('should emit an event with the current component id when handleOnBindVariableChange is called', () => {
    spyOn(component.onBindVariableChange, 'emit');
    component.handleOnBindVariableChange('');
    expect(component.onBindVariableChange.emit).toHaveBeenCalledWith({
      value: '',
      id: component.component.id
    });
  });

  it('should toggle dropdownPinColor properties correctly', () => {
    const component = new DropdownPropertyComponent();
    component.dropdownPinColor = {
      FormLabelPin: true,
      ShowLabelPin: true,
      DefaultTypePin: true
    };
    component.pinSetting(null, 'FormLabelPin');
    component.pinSetting(null, 'ShowLabelPin');
    component.pinSetting(null, 'DefaultTypePin');
    expect(component.dropdownPinColor).toEqual({
      FormLabelPin: false,
      ShowLabelPin: false,
      DefaultTypePin: false
    });
  });

  it('should set default_value to an empty string', () => {
    const component = new DropdownPropertyComponent();
    component.component = { element: { default_value_type: 'none', default_value: 'test' } };
    component.onDefaultValueTypeChange();
    expect(component.component.element.default_value).toEqual('');
  });
});
