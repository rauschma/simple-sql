import type { DatabaseSync, StatementResultingChanges, SupportedValueType } from 'node:sqlite';
import { type TypeRecord, type TypeRecordToType } from './type-record.ts';

type DatabaseTableProps<TR extends TypeRecord, T, K extends string> = {
  db: DatabaseSync,
  tableName: string,
  typeRecord: TR,
  sqlTypes: Record<K, string>,
  jsToSql: (obj: T) => Record<K, SupportedValueType>,
  sqlToJs: (sql: Record<K, any>) => T,
};
export class DatabaseTable<TR extends TypeRecord, T = TypeRecordToType<TR>, K extends string = keyof TR & string> {
  #db: DatabaseSync;
  #tableName: string;
  #sqlTypes: Record<K, string>;
  #propKeys: string[];
  #jsToSql: (obj: T) => Record<K, SupportedValueType>;
  #sqlToJs: (sql: Record<K, any>) => T;

  constructor(
    { db, tableName, typeRecord, sqlTypes, jsToSql, sqlToJs }: DatabaseTableProps<TR, T, K>
  ) {
    this.#db = db;
    this.#tableName = tableName;
    this.#propKeys = Object.keys(typeRecord);
    this.#sqlTypes = sqlTypes;
    this.#jsToSql = jsToSql;
    this.#sqlToJs = sqlToJs;
  }

  createTable(): void {
    const sql = [
      `CREATE TABLE IF NOT EXISTS ${this.#tableName} (`,
      Object.entries(this.#sqlTypes)
        .map(
          ([fieldName, fieldType]) => `  ${fieldName} ${fieldType}`
        )
        .join(',\n')
      ,
      `)`,
    ].join('\n');
    console.debug('🟢\n%s', sql);
    this.#db.exec(sql);
  }

  select(where?: Partial<Record<K, SupportedValueType>>, orderBy?: Partial<Record<K, 'ASC' | 'DESC'>>): SelectResult<T> {
    let sql = `SELECT ${this.#propKeys.join(', ')} FROM ${this.#tableName}\n`;
    let values: Array<SupportedValueType> = [];
    if (where) {
      sql += 'WHERE ' +
        Object.keys(where).map(k => `${k} = ?`).join(' AND ')
        ;
      sql += '\n';
      values = Object.values(where);
    }
    if (orderBy) {
      sql += 'ORDER BY ' + Object.entries(orderBy)
        .map(
          ([fieldName, sortDirection]) => fieldName + ' ' + sortDirection
        )
        .join(', ')
        ;
      sql += '\n';
    }
    const _this = this;
    const select = this.#db.prepare(sql);
    console.debug('🟢\n%s', sql);
    return {
      all() {
        const result = select.all(...values) as Array<Record<K, any>>;
        return result.map(_this.#sqlToJs);
      },
      get() {
        const result = select.get(...values) as Record<K, any>;
        return _this.#sqlToJs(result);
      },
    };
  }

  insert(): InsertResult<T> {
    const $propKeys = this.#propKeys.map(key => '$' + key)
    const sql = (
      `INSERT INTO ${this.#tableName} (${this.#propKeys.join(', ')}) VALUES (${$propKeys.join(', ')})`
    );
    console.debug('🟢\n%s', sql);
    const insert = this.#db.prepare(sql);
    const _this = this;
    return {
      run(jsObj: T): StatementResultingChanges {
        const params = Object.fromEntries(
          Object.entries(
            _this.#jsToSql(jsObj)
          )
            .map(([key, value]) => ['$' + key, value])
        ) as Record<string, SupportedValueType>;
        return insert.run(params);
      }
    };
  }
}

export interface SelectResult<T> {
  all(): Array<T>;
  get(): T;
}
export interface InsertResult<T> {
  run(jsObj: T): StatementResultingChanges;
}
