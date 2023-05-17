import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PinnedPanelComponent } from './pinned-panel.component';

describe('PinnedPanelComponent', () => {
  let component: PinnedPanelComponent;
  let fixture: ComponentFixture<PinnedPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PinnedPanelComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PinnedPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
