import { isObjectOrArray } from './isObjectOrArray';

// this is a MUTATOR function, so be careful
export function mixCustomFieldsIntoApiQuery(query: {fields?: any, where?: any, order?: any, group?: any}): void {
	const fields: {[key: string]: any} = query?.fields || {},
		entries = Array
			.from(Object.entries(fields))
			.filter(([k, v]) => fields.hasOwnProperty(k) && isObjectOrArray(v));

	if (entries.length) {
		['where', 'order', 'group']
			.filter(p => query.hasOwnProperty(p) && isObjectOrArray(query[p]))
			.forEach(p => {
				let json = JSON.stringify(query[p]);
				entries.forEach(([key, val]) => {
					const search = JSON.stringify(['$field', key]),
						repl = JSON.stringify(val);
					json = json.replace(search, repl);
				})
				query[p] = JSON.parse(json);
			});
		// console.log('after', {query});
	}
}
