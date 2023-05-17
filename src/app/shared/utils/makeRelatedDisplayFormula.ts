import { JotFieldDef } from '../models/jot';
import { Relationship } from '../models/slice';

export function makeRelatedDisplayFormula(field: string, def: JotFieldDef, rel: Relationship) {
	const name = rel.name;
	let formula = def.displayFormula;
	// replaces any { character, that isn't inside double quotes, with {name: prefixing
	formula = formula
		.replace(/(\{\b)(?=(?:[^"]|"[^"]*")*$)/g, `{${name}:`);
		// we MAY have issues with name:report where we need to remove it, not sure yet
	return ['$coalesce', {$excel: formula}, ['$field', field]];
}
