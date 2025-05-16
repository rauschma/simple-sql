export type Class<T> = abstract new (...args: Array<any>) => T;

export type TagFunction<Substs = unknown, Result = string> = (
  templateStrings: TemplateStringsArray,
  ...substitutions: Array<Substs>
) => Result;

export function removePrefixMaybe(str: string, prefix: string): string {
  if (!str.startsWith(prefix)) {
    return str;
  }
  return str.slice(prefix.length);
}