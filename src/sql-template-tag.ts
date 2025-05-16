import type { SupportedValueType } from 'node:sqlite';
import { ColName } from './sql-type-map.ts';
import { removePrefixMaybe, type TagFunction } from './util.ts';

export const LINE_TERMINATOR = '\n';

export const sql: TagFunction<ColName | SupportedValueType, SqlFragment> = (templateStrings, ...substitutions) => {
  let sqlStr = templateStrings[0]!;
  const values: Array<SupportedValueType> = [];
  for (let i = 0; i < substitutions.length; i++) {
    const subst = substitutions[i]!;
    if (subst instanceof ColName) {
      sqlStr += subst.name;
    } else {
      sqlStr += '?';
      values.push(subst);
    }
    sqlStr += templateStrings[i + 1];
  }
  sqlStr = sqlStr.trimEnd();
  // Line terminator is always \n in tagged templates
  const initialLineTerminatorMatch = /^[ \t]*\n([^]*)$/.exec(sqlStr);
  if (initialLineTerminatorMatch) {
    sqlStr = initialLineTerminatorMatch[1]!;
  }
  // Line terminator is always \n in tagged templates
  let lines = sqlStr.split(/\n/);
  if (0 in lines) {
    const leading = extractLeadingWhitespace(lines[0]);
    lines = lines.map(l => removePrefixMaybe(l, leading))
  }
  return {
    sqlStr: lines.join(LINE_TERMINATOR),
    values,
  };
};

/**
 * Result of `sql` template tag
 */
export interface SqlFragment {
  sqlStr: string,
  values: Array<SupportedValueType>,
}

const RE = /^([ \t]*)/;
function extractLeadingWhitespace(str: string) {
  const match = RE.exec(str)!;
  return match[1]!;
}
