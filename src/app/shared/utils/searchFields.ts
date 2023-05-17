import { SliceQueryParams } from '../models/slice';

export function searchFields(qp: SliceQueryParams, words: string[], singleFieldMatch?: boolean) {

	const fields = Object.keys(qp.fields || {}),
		where: any[] = [singleFieldMatch ? '$or' : '$and'];

	if (words && words.length) {


		if (singleFieldMatch) {
			throw 'untested';
			fields.forEach(field => {
				const w: any[] = ['$and'];
				words.forEach(word => {
					w.push(['$contains', ['$field', field], word]);
				});
				where.push(w);
			});
		} else {
			words.forEach(word => {
				const w: any[] = ['$or'];
				fields.forEach(field => {
					const def = qp.fields[field];
					let f: any;
					if (typeof def === 'string') {
						f = ['$field', def];
					} else {
						f = def;
					}
					w.push(['$contains', f, word]);
				});
				where.push(w);
			});
		}
	}

	if (where.length > 1) {
		if (qp.where) {
			qp.where = ['$and', qp.where, where];
		} else {
			qp.where = where;
		}
	}
}
