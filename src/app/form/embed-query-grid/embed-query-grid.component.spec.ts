import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmbedQueryGridComponent } from './embed-query-grid.component';

describe('EmbedQueryGridComponent', () => {
  let component: EmbedQueryGridComponent;
  let fixture: ComponentFixture<EmbedQueryGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EmbedQueryGridComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EmbedQueryGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
