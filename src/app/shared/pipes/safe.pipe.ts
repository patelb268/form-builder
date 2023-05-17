import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeStyle, SafeScript, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';

export type SafeTypes = 'html' | 'style' | 'script' | 'url' | 'resourceUrl';

@Pipe({
  name: 'safe'
})
export class SafePipe implements PipeTransform {

	constructor(
		private _sanitizer: DomSanitizer,
	) { }

	transform(value: any, type: SafeTypes): SafeHtml | SafeStyle | SafeScript | SafeUrl | SafeResourceUrl {
		const s = this._sanitizer;
		switch (type) {
			case 'html': return s.bypassSecurityTrustHtml(value);
			case 'style': return s.bypassSecurityTrustStyle(value);
			case 'script': return s.bypassSecurityTrustScript(value);
			case 'url': return s.bypassSecurityTrustUrl(value);
			case 'resourceUrl': return s.bypassSecurityTrustResourceUrl(value);
			default:
				throw 'invalid_or_missing_type';
		}
	}

}
