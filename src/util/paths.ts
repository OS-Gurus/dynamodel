import { AutoPath } from 'ts-toolbelt/out/Function/AutoPath'
import { Path } from 'ts-toolbelt/out/Object/Path'
import { Length } from 'ts-toolbelt/out/List/Length'
import { Split } from 'ts-toolbelt/out/String/Split'

export type AtPath<T, P extends string> = Path<T, Split<P, '.'>>
export type IsPath<P extends string> = Length<Split<P, '.'>> extends 1 ? false : true
export type StringKeys<T> = Extract<keyof T, string>
export type PathOf<T, P extends string> = IsPath<P> extends false
  ? StringKeys<T>
  : AutoPath<T, P>

export function isRecord (obj: unknown): obj is Record<string, unknown> {
  return (!!obj && typeof obj === 'object')
}

export const atPaths = (obj: unknown, paths: string[]) =>
  paths.reduce(
    (prev, current) => isRecord(prev) ? prev[current as string] : prev,
    obj
  )

export const atPath = (obj: unknown, path: string) =>
  path.split('.').reduce(
    (prev, current) => isRecord(prev) ? prev[current] : prev,
    obj
  )
