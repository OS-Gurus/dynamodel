import { String, Object } from 'ts-toolbelt'
import { DynamoDB } from 'aws-sdk'

/**
 * Merge combined record types into one.
 * @example
 *   type FooBar = MergeProps<{ foo: string } & { bar: string }>
 *   // ☝️ type FooBar = { foo: string, bar: string }
 */
type MergeProps<T> = { [K in keyof T]: T[K] }

/** Props on all items, merged with consumer defined attributes. */
type MetaProps = { createdAt: string, updatedAt: string }

/**
 * Define DDB record type, merges meta with given attribute types and default meta.
 * @param Props Attributes to merge into item type, can be subset of item in DB for a given model.
 * @example
 *   type UserItem = Item<{ name: string }, { userId: string }>
 *   // ☝️ type UserItem = { userId: string, name: string, createdAt: string, updatedAt: string }
 */
export type Item<Props, Key extends DynamoDB.DocumentClient.Key> = MergeProps<Key & Props & MetaProps>

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20, ...0[]]

type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}${'' extends P
      ? '' : '.'}${P}` : never
  : never;

export type Paths<T, D extends number = 2> = [D] extends [never] ? never : T extends Record<string, unknown> ?
    { [K in keyof T]-?: K extends string | number
        ? `${K}` | Join<K, Paths<T[K], Prev[D]>>
        : never
    }[keyof T] : ''

export type AtPath<T, P extends Paths<T, 2>> = Object.Path<T, String.Split<P, '.'>>

/** Make all props not optional without removing undefined from value types. */
export type NonPartial<T> = { [K in keyof Required<T>]: T[K] };
