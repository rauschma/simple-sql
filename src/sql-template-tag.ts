import type { SupportedValueType } from 'node:sqlite';
import { ColName } from './sql-type-map.ts';
import { extractLeadingWhitespace, removePrefix, type TagFunction } from './util.ts';

export const sql: TagFunction<ColName | SupportedValueType, SqlValues> = (templateStrings, ...substitutions) => {
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
  let lineTerminator = '\n';
  const initialLineTerminatorMatch = /^[ \t]*(\r?\n)([^]*)$/.exec(sqlStr);
  if (initialLineTerminatorMatch) {
    lineTerminator = initialLineTerminatorMatch[1]!;
    sqlStr = initialLineTerminatorMatch[2]!;
  }
  let lines = sqlStr.split(/\r?\n/);
  if (0 in lines) {
    const leading = extractLeadingWhitespace(lines[0]);
    lines = lines.map(l => removePrefix(l, leading))
  }
  return {
    sqlStr: lines.join(lineTerminator),
    lineTerminator,
    values,
  };
};

export interface SqlValues {
  sqlStr: string,
  lineTerminator: string,
  values: Array<SupportedValueType>,
}
