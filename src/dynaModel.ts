import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import {
  AtPath,
  atPath,
  attributeNames,
  updateExpression,
  metaAttributeNames,
  metaAttributeValues,
  joinExpressions,
  metaUpdateExpressions,
  handleFailedCondition,
  updateValues,
  nestedCondition,
  insertExpression,
  getExpression,
  nestedValue,
  PathOf
} from './util'

/** Props on all items, merged with consumer defined attributes. */
type MetaProps = { createdAt: string, updatedAt: string }

/** Make all props not optional without removing undefined from value types. */
export type NonPartial<T> = { [K in keyof Required<T>]: T[K] };

/**
 * Define DDB record type, merges meta with given attribute types and default meta.
 * @param Props Attributes to merge into item type, can be subset of item in DB for a given model.
 * @example
 *   type UserItem = Item<{ name: string }, { userId: string }>
 *   // ☝️ type UserItem = { userId: string, name: string, createdAt: string, updatedAt: string }
 */
type Item<Props, Key extends DocumentClient.Key> = Key & Props & MetaProps

/** Options for update/insert methods. */
type Options = {
  /** Return the touched attributes, or the whole item */
  projection?: 'Item' | 'Attributes'
}

/** Default options to merge with given. */
const defaults: Options = {
  projection: 'Attributes'
}

/**
 * Provides a suite of functions to construct a typed DynamoDB data model CRUD interface.
 * @param ddb An instantiated DDB client so configuration is delegated to consumer
 * @param TableName Given for interface property paths to all extending a single table's items
 * @template HashKeys Optional interface for table's ID fields, defaults to `{ userId: string }`
 * @template Props Properties of model, to be merged with hash keys and default meta attributes.
 * @example
 *   type UserData = { name: string }
 *   const userModelMaker = dynaModel(ddb, 'users-table-production').make<UserData>()
 *   const userModel = {
 *     getUsers = userModelMaker.getAll(),
 *     getUser = userModelMaker.get(),
 *     getUserName = userModelMaker.getProperty('name')
 *   }
 */
export const dynaModel = <
  HashKeys extends DocumentClient.Key,
  Props
>(ddb: DocumentClient, TableName: string) => {
  /**
   * Get all items of a given type
   * @example
   *   const allUsersData = await getAllUserData()
   *   const getAllUserData = dynaModel(ddb, 'users-table-production').make<UserData>.get()
   */
  function makeGetAll () {
    return async () => {
      const { Items } = await ddb.scan({ TableName }).promise()
      return Items as Item<Props, HashKeys>[]
    }
  }

  /**
   * Get an item of given type by id.
   * @example
   *   const getUserData = makeGetById<UserData>()
   *   const userData = await getUserData('a_user_id')
   */
  function makeGet () {
    return async (Key: HashKeys) => {
      const { Item } = await ddb.get({ TableName, Key }).promise()
      return Item as Item<Props, HashKeys> | undefined
    }
  }

  /**
   * Get meta properties of an item (updated and created dates and hash keys)
   */
  function makeGetMeta () {
    return async (Key: HashKeys) => {
      const { Item } = await ddb.get({
        TableName,
        Key,
        ExpressionAttributeNames: metaAttributeNames(),
        ProjectionExpression: Object.keys(metaAttributeNames()).join('.')
      }).promise()
      return { ...Key, ...Item } as Item<Record<string, never>, HashKeys>
    }
  }

  /**
   * Get a property of an item at given path.
   * @example
   *   const getUserName = makeGetPropertyById<UserData>('name')
   *   const userName = await getUserName('a_user_id')
   */
  function makeGetProperty <P extends string> (path: PathOf<Props, P>) {
    return async <T extends AtPath<Props, P>>(Key: HashKeys) => {
      const { Item } = await ddb.get({
        TableName,
        Key,
        ExpressionAttributeNames: attributeNames(path.split('.')),
        ProjectionExpression: getExpression(path.split('.'))
      }).promise()
      return Item
        ? atPath(Item, path) as T
        : undefined
    }
  }

  /**
   * Delete an item by id, returning the deleted item.
   * @example
   *   const deleteUser = makeDelete<UserData>()
   *   const deletedUser = await deleteUser('a_user_id')
   */
  function makeRemove () {
    return async (Key: HashKeys) => {
      const { Attributes } = await ddb.delete({ TableName, Key, ReturnValues: 'ALL_OLD' }).promise()
      return Attributes as Item<Props, HashKeys> | undefined
    }
  }

  /**
   * Set (upsert) an item property at given path.
   * If nested path given and parent object exists, update will apply at the given path.
   * If parent object doesn't exist it will be created with nested property as given.
   * It implicitly sets `updatedAt` and also `createdAt` on first update only.
   * @example
   *   const updateUserName = set<UserData>('name')
   *   await updateUserName('a_user_id', 'a_user_name')
   */
  function makeUpdateProperty <P extends string> (path: PathOf<Props, P>, options: Options = {}) {
    const { projection } = { ...defaults, ...options }
    return async <T extends AtPath<Props, P>>(Key: HashKeys, valueAtPath: T) => {
      const paths = path.split('.')
      const value = nestedValue(paths, valueAtPath)
      for (const index of paths.keys()) {
        paths.splice(-1, index)
        const result = await ddb.update({
          Key,
          TableName,
          ReturnValues: 'ALL_NEW',
          ConditionExpression: nestedCondition(paths),
          ExpressionAttributeNames: {
            ...metaAttributeNames(),
            ...attributeNames(paths)
          },
          ExpressionAttributeValues: {
            ...metaAttributeValues(),
            ...updateValues(paths, value)
          },
          UpdateExpression: joinExpressions('SET', [
            ...metaUpdateExpressions(),
            updateExpression(paths)
          ])
        }).promise().catch(handleFailedCondition)
        if (result?.Attributes) {
          return projection === 'Attributes'
            ? atPath(result.Attributes, path) as T
            : result.Attributes as Item<Props, HashKeys>
        }
      }
      throw new Error(`No attributes returned from update to ${path} on ${TableName}`)
    }
  }

  /**
   * Set an item property at given path if it does no exists.
   * If nested path given and parent object exists, insert will apply at the given path.
   * If parent object doesn't exist it will be created with nested property as given.
   * It implicitly sets `updatedAt` and also `createdAt` on first update only.
   * @example
   *   const updateUserName = set<UserData>('name')
   *   await updateUserName('a_user_id', 'a_user_name')
   */
  function makeInsertProperty <P extends string> (path: PathOf<Props, P>, options: Options = {}) {
    return async <T extends AtPath<Props, P>>(Key: HashKeys, valueAtPath: T) => {
      const { projection } = { ...defaults, ...options }
      const paths = path.split('.')
      const value = nestedValue(paths, valueAtPath)
      for (const index of paths.keys()) {
        paths.splice(-1, index)
        const result = await ddb.update({
          Key,
          TableName,
          ReturnValues: 'ALL_NEW',
          ConditionExpression: nestedCondition(paths),
          ExpressionAttributeNames: {
            ...metaAttributeNames(),
            ...attributeNames(paths)
          },
          ExpressionAttributeValues: {
            ...metaAttributeValues(),
            ...updateValues(paths, value)
          },
          UpdateExpression: joinExpressions('SET', [
            ...metaUpdateExpressions(),
            insertExpression(paths)
          ])
        }).promise().catch(handleFailedCondition)
        if (result && result.Attributes) {
          return projection === 'Attributes'
            ? atPath(result.Attributes, path) as T
            : result.Attributes as Item<Props, HashKeys>
        }
      }
    }
  }

  return {
    makeGetAll,
    makeGet,
    makeGetMeta,
    makeGetProperty,
    makeRemove,
    makeUpdateProperty,
    makeInsertProperty
  }
}
