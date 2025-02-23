export type Class<T> = abstract new (...args: Array<any>) => T;

export type TagFunction<Substs = unknown, Result = string> = (
  templateStrings: TemplateStringsArray,
  ...substitutions: Array<Substs>
) => Result;

export function pick<
  T extends Record<string, any>,
  K extends ReadonlyArray<keyof T>
>(obj: T, ...keys: K) {
  return Object.fromEntries(
    Object.entries(obj)
    .filter(([key, value]) => keys.includes(key))
  ) as Pick<T, K[number]>;
}

const RE = /^([ \t]*)/;
export function extractLeadingWhitespace(str: string) {
  const match = RE.exec(str)!;
  return match[1]!;
}

export function removePrefix(str: string, prefix: string): string {
  if (!str.startsWith(prefix)) {
    return str;
  }
  return str.slice(prefix.length);
}