//#################### SqlTypeToTsType ####################

/**
 * @see https://nodejs.org/api/sqlite.html#type-conversion-between-javascript-and-sqlite
 */
type SqlTypeToTsType = {
  'TEXT': string,
  'REAL': number,
  /**
   * Reading SQLite integers normally returns JS numbers, but
   * `databaseTable.select()` uses `statement.setReadBigInts(true)` to
   * change that.
   */
  'INTEGER': bigint,
};
type SqlType = keyof SqlTypeToTsType;

//#################### SqlTypeMap ####################

export type SqlTypeMap = Record<string, SqlTypeDef>;
export type SqlTypeDef =
  | `${SqlTypeWithAnnotation}`
  | `${SqlTypeWithAnnotation} PRIMARY KEY`
;
type SqlTypeWithAnnotation =
  | `${SqlType}`
  | `${SqlType} NOT NULL`
;

//#################### SqlTypeMapToSqlObj ####################

export type SqlTypeMapToSqlObj<STM extends SqlTypeMap> = {
  [K in keyof STM]: SqlTypeDefToTsType<STM[K]>
};

type SqlTypeDefToTsType<S extends SqlTypeDef> =
  S extends `${infer T extends SqlTypeWithAnnotation} PRIMARY KEY`
    ? SqlTypeWithAnnotationToTsType<T>
    : S extends SqlTypeWithAnnotation
      ? SqlTypeWithAnnotationToTsType<S>
      : never
;
type SqlTypeWithAnnotationToTsType<S extends SqlTypeWithAnnotation> =
  S extends `${infer T extends SqlType} NOT NULL`
    ? SqlTypeToTsType[T]
    : S extends SqlType
    ? SqlTypeToTsType[S] | null
    : never
;

//#################### createColEnum ####################

export function createColEnum<STM extends SqlTypeMap>(typeRecord: STM) {
  return Object.fromEntries(
    Object.entries(typeRecord)
      .map(([key, _value]) => [key, new ColName(key)])
  ) as SqlTypeMapToColEnum<STM>;
}

export type SqlTypeMapToColEnum<STM extends SqlTypeMap> = {
  [K in keyof STM]: ColName
};

/**
 * Wrapping column names in class instances helps the `sql` template tag
 * distinguish values from column names.
 */
export class ColName {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
  toString() {
    return `${ColName.name}(${this.name})`;
  }
}

//#################### Helpers ####################

/**
 * Can be used to extract smaller SqlTypeMaps from an SqlTypeMap.
 */
export function pickProps<
  T extends Record<string, any>,
  K extends ReadonlyArray<keyof T>
>(obj: T, ...keys: K) {
  return Object.fromEntries(
    Object.entries(obj)
    .filter(([key, _value]) => keys.includes(key))
  ) as Pick<T, K[number]>;
}
