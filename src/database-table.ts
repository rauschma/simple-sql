import type { DatabaseSync, StatementResultingChanges, SupportedValueType } from 'node:sqlite';
import { LINE_TERMINATOR, type SqlFragment } from './sql-template-tag.ts';
import { type SqlTypeMap, type SqlTypeMapToSqlObj } from './sql-type-map.ts';

type DatabaseTableProps<STM extends SqlTypeMap> = {
  db: DatabaseSync,
  tableName: string,
  sqlTypeMap: STM,
  logSql?: boolean,
};

export class DatabaseTable<
  STM extends SqlTypeMap,
  SO extends Record<string, any> = SqlTypeMapToSqlObj<STM>
> {
  #db: DatabaseSync;
  #tableName: string;
  #sqlTypeMap: STM;
  #propKeys: string[];
  #logSql: boolean;

  constructor(
    { db, tableName, sqlTypeMap, logSql = false }: DatabaseTableProps<STM>
  ) {
    this.#db = db;
    this.#tableName = tableName;
    this.#sqlTypeMap = sqlTypeMap;
    this.#propKeys = Object.keys(sqlTypeMap);
    this.#logSql = logSql;
  }
  #maybeLogSql(sql: string) {
    if (this.#logSql) {
      console.log();
      console.log(sql);
    }
  }

  createTable(): void {
    const sql = [
      `CREATE TABLE IF NOT EXISTS ${this.#tableName} (`,
      Object.entries(this.#sqlTypeMap)
        .map(
          ([fieldName, fieldType]) => `  ${fieldName} ${fieldType}`
        )
        .join(',\n')
      ,
      `)`,
    ].join('\n');
    this.#maybeLogSql(sql);
    this.#db.exec(sql);
  }

  delete(sqlFragment: SqlFragment): void {
    let sql = `DELETE FROM ${this.#tableName}`;
    let values: Array<SupportedValueType> = [];
    if (sqlFragment) {
      sql += LINE_TERMINATOR;
      sql += sqlFragment.sqlStr;
      values = sqlFragment.values;
    }
    this.#maybeLogSql(sql);
    this.#db.exec(sql);
  }

  select<
    SOpt extends SqlTypeMap | '*',
    S extends SqlTypeMap = SOpt extends '*' ? STM : SOpt,
    SqlObj = SqlTypeMapToSqlObj<S>,
  >(
    sqlTypeMapOpt: SOpt,
    sqlFragment?: SqlFragment,
  ): SelectResult<SqlObj> {
    const sqlTypeMap = sqlTypeMapOpt === '*' ? this.#sqlTypeMap : sqlTypeMapOpt;

    let sql = `SELECT ${Object.keys(sqlTypeMap).join(', ')} FROM ${this.#tableName}`;
    let values: Array<SupportedValueType> = [];
    if (sqlFragment) {
      sql += LINE_TERMINATOR;
      sql += sqlFragment.sqlStr;
      values = sqlFragment.values;
    }
    this.#maybeLogSql(sql);
    const select = this.#db.prepare(sql);
    select.setReadBigInts(true);
    return {
      all: () => select.all(...values) as Array<SqlObj>,
      get: () => select.get(...values) as SqlObj,
    } satisfies SelectResult<SqlObj>;
  }

  replace(): ReplaceResult<SO> {
    const $propKeys = this.#propKeys.map(key => '$' + key)
    const sql = (
      `REPLACE INTO ${this.#tableName} (${this.#propKeys.join(', ')}) VALUES (${$propKeys.join(', ')})`
    );
    this.#maybeLogSql(sql);
    const insert = this.#db.prepare(sql);
    return {
      run(sqlObj: SO): StatementResultingChanges {
        const params = Object.fromEntries(
          Object.entries(sqlObj)
            .map(([key, value]) => ['$' + key, value])
        ) as Record<string, SupportedValueType>;
        return insert.run(params);
      }
    };
  }
}

export interface SelectResult<SqlObj> {
  all(): Array<SqlObj>;
  get(): SqlObj;
}
export interface ReplaceResult<SqlObj> {
  run(sqlObj: SqlObj): StatementResultingChanges;
}
