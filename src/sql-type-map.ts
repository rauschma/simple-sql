// https://nodejs.org/api/sqlite.html#type-conversion-between-javascript-and-sqlite
type SqlTypeToTsType = {
  'TEXT': string,
  'REAL': number,
  'INTEGER': bigint,
};
type SqlType = keyof SqlTypeToTsType;
type SqlTypeWithAnnotation =
  | `${SqlType}`
  | `${SqlType} NOT NULL`
;
export type SqlTypeDef =
  | `${SqlTypeWithAnnotation}`
  | `${SqlTypeWithAnnotation} PRIMARY KEY`
;

type SqlTypeDefToTsType<S extends SqlTypeDef> =
  S extends `${infer T} PRIMARY KEY`
    ? _SqlTypeDefToTsType<T>
    : _SqlTypeDefToTsType<S>
;
type _SqlTypeDefToTsType<S extends string> =
  S extends `${infer T} NOT NULL`
    ? LookupSqlType<T>
    : LookupSqlType<S> | null
;
type LookupSqlType<S extends string> =
  S extends keyof SqlTypeToTsType
    ? SqlTypeToTsType[S]
    : never
;

export type SqlTypeMap = Record<string, SqlTypeDef>;

export type SqlTypeMapToSqlObj<STM extends SqlTypeMap> = {
  [K in keyof STM]: SqlTypeDefToTsType<STM[K]>
};

export type SqlTypeMapToColEnum<STM extends SqlTypeMap> = {
  [K in keyof STM]: ColName
};

export class ColName {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}
export function createColEnum<STM extends SqlTypeMap>(typeRecord: STM) {
  return Object.fromEntries(
    Object.entries(typeRecord)
      .map(([key, _value]) => [key, new ColName(key)])
  ) as SqlTypeMapToColEnum<STM>;
}
