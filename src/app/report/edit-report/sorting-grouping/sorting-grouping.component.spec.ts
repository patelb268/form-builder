import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SortingGroupingComponent } from './sorting-grouping.component';

describe('SortingGroupingComponent', () => {
  let component: SortingGroupingComponent;
  let fixture: ComponentFixture<SortingGroupingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SortingGroupingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SortingGroupingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
