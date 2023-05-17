import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormulaFieldSelectorComponent } from './formula-field-selector.component';

describe('FormulaFieldSelectorComponent', () => {
  let component: FormulaFieldSelectorComponent;
  let fixture: ComponentFixture<FormulaFieldSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormulaFieldSelectorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormulaFieldSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
