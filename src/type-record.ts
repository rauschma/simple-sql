export type Class<T> = abstract new (...args: Array<any>) => T;
type StringToPrimitive = {
  null: null,
  string: string,
};

export interface ArrayType<T extends TypeId> {
  typeId: T;
}
export function ArrayType<T extends TypeId>(typeId: T): ArrayType<T> {
  return { typeId };
}

export interface UnionType<Elems extends [TypeId, ...TypeId[]]> {
  typeIds: Elems;
}
export function UnionType<Elems extends [TypeId, ...TypeId[]]>(...typeIds: Elems): UnionType<Elems> {
  return { typeIds };
}

export type TypeId = keyof StringToPrimitive | Class<any> | ArrayType<any> | UnionType<any>;

type TypeIdToType<T extends TypeId> =
  T extends ArrayType<infer Elem>
    ? Array<TypeIdToType<Elem>>
    : T extends UnionType<infer Elems>
      ? {[K in number]: TypeIdToType<Elems[K]>}[number]
      : T extends keyof StringToPrimitive
        ? StringToPrimitive[T]
        : T extends Class<infer Inst>
          ? Inst
          : never
;
export type TypeRecord = Record<string, TypeId>;
export type TypeRecordToType<TR extends TypeRecord> = {
  [K in keyof TR]: TypeIdToType<TR[K]>
};
