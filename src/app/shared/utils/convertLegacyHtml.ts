export function convertLegacyHtml(html: string): string {

	const node = document.createElement('div');

	html = '' + (html || '');

	/**
	 * #editFormRecord=slice-record
	 */
	html = html.replace(/#editFormRecord=([0-9]*)-([0-9]*)/g, (match: string, slice: string, record: string) => {
		return `form/${slice}/${record}`;
	});

	node.innerHTML = html;

	// any http requests should be routed to a new window (target="_blank")
	(Array.from(node.querySelectorAll<HTMLAnchorElement>('a[href^="http"]')))
		.forEach(n => n.target = '_blank');

	return node.innerHTML;

}
