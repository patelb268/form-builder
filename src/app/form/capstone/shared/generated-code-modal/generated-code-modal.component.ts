import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
// import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-generated-code-modal',
  templateUrl: './generated-code-modal.component.html',
  styleUrls: ['./generated-code-modal.component.scss'],
})
export class GeneratedCodeModalComponent {
  @Input() title: string = '';
  @Input() content: string = '';
  constructor(public modal: NgbActiveModal) {}
}
