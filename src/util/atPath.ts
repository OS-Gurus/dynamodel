import { Paths, AtPath } from './types'

export function isRecord (obj: unknown): obj is Record<string, unknown> {
  return (!!obj && typeof obj === 'object')
}

export const atPath = <T, P extends Paths<T, 2>>(obj: T, path: P) =>
  path.split('.').reduce(
    (prev, current) => isRecord(prev) ? prev[current] : prev,
    obj as unknown
  ) as AtPath<T, P>
