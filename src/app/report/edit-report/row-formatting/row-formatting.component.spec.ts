import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RowFormattingComponent } from './row-formatting.component';

describe('RowFormattingComponent', () => {
  let component: RowFormattingComponent;
  let fixture: ComponentFixture<RowFormattingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RowFormattingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RowFormattingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
