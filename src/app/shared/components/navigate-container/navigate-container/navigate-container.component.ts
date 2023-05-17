import { Component, OnInit, ChangeDetectionStrategy, ContentChildren, QueryList, AfterContentInit, ChangeDetectorRef, Input, ViewChild, ElementRef } from '@angular/core';
import { NavigateSectionContainerComponent } from '../navigate-section/navigate-section.component';


@Component({
	selector: 'navigate-container',
	templateUrl: './navigate-container.component.html',
	styleUrls: ['./navigate-container.component.scss'],
	
})
export class NavigateContainerComponent implements OnInit {

	@Input() behavior: 'smooth' | 'auto' = 'smooth';
	@ContentChildren(NavigateSectionContainerComponent) containers: QueryList<NavigateSectionContainerComponent>;
	@ViewChild('navigateContentContainer', {static: true, read: ElementRef}) navigateContentContainer: ElementRef<HTMLElement>;

	constructor(
		private _cd: ChangeDetectorRef,
	) { }

	ngOnInit(): void {
	}

	moveTop() {
		this.navigateContentContainer.nativeElement.scrollTo({top: 0, left: 0, behavior: this.behavior});
	}

	moveTo(c: NavigateSectionContainerComponent) {

		const idx = Array.from(this.containers).indexOf(c),
			elem = c.elem.nativeElement,
			scroller = this.navigateContentContainer.nativeElement;

		scroller.scrollTo({
			left: elem.offsetLeft,
			top: !idx ? 0 : elem.offsetTop,
			behavior: this.behavior
		});

		console.log({left: 0, top: elem.scrollTop, behavior: this.behavior});
		//
	}

}
