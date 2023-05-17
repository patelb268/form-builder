import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckboxPropertyComponent } from './checkbox-property.component';

describe('CheckboxPropertyComponent', () => {
  let component: CheckboxPropertyComponent;
  let fixture: ComponentFixture<CheckboxPropertyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CheckboxPropertyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckboxPropertyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
