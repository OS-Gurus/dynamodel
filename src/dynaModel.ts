import {
  Item,
  Paths,
  AtPath,
  atPath,
  NonPartial,
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
  nestedValue
} from './util'
import { DynamoDB } from 'aws-sdk'

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
  HashKeys extends DynamoDB.DocumentClient.Key,
  Props
>(ddb: DynamoDB.DocumentClient, TableName: string) => {
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
  function makeGetProperty (property: Paths<Props>) {
    return async (Key: HashKeys) => {
      const { Item } = await ddb.get({
        TableName,
        Key,
        ExpressionAttributeNames: attributeNames(property.split('.')),
        ProjectionExpression: getExpression(property.split('.'))
      }).promise()
      return Item
        ? atPath(Item as Props, property)
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
  function makeUpdateProperty <Path extends Paths<Props>>(property: Path) {
    return async (Key: HashKeys, valueAtPath: AtPath<NonPartial<Props>, Path>) => {
      const paths = property.split('.')
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
        if (result && result.Attributes) {
          return atPath<Props, Path>(result.Attributes as unknown as Props, property)
        }
      }
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
  function makeInsertProperty <Path extends Paths<Props>>(property: Path) {
    return async (Key: HashKeys, valueAtPath: AtPath<NonPartial<Props>, Path>) => {
      const paths = property.split('.')
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
          return atPath<Props, Path>(result.Attributes as unknown as Props, property)
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
