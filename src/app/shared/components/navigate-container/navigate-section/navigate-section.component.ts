import { Component, ChangeDetectionStrategy, Input, ElementRef } from '@angular/core';
import { ThemePalette } from '@angular/material/core';

@Component({
	selector: 'navigate-section',
	
	styleUrls: ['./navigate-section.component.scss'],
	templateUrl: './navigate-section.component.html',
})
export class NavigateSectionContainerComponent {

	@Input() color: ThemePalette;
	@Input() title: string;
	@Input() description: string;

	constructor(
		public elem: ElementRef<HTMLElement>,
	) { }
}
