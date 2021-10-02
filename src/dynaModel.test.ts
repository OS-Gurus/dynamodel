import { DynamoDB } from 'aws-sdk'
import { dynaModel } from './dynaModel'

const ddb = new DynamoDB.DocumentClient({
  endpoint: process.env.MOCK_DYNAMODB_ENDPOINT,
  sslEnabled: false,
  region: 'local'
})

const TableName = 'test-data'
const Key = { userId: 'test_userId' }
const Item = { ...Key, test: process.env.JEST_WORKER_ID || '111' }
type TestProps = {
  test: string
  testCount?: number
  testData?: {
    foo?: boolean
    bar?: boolean
    baz?: { qux: boolean }
  },
  nullable: null
}

const {
  makeGetAll,
  makeGet,
  makeGetMeta,
  makeGetProperty,
  makeRemove,
  makeInsertProperty,
  makeUpdateProperty
} = dynaModel<typeof Key, TestProps>(ddb, TableName)

const expectMeta = {
  createdAt: expect.any(String),
  updatedAt: expect.any(String)
}

/**
 * @note
 * `jest-dynalite` preset clears tables between tests and runs each test in a contained DDB server,
 * so beforeEach/All functions can't be used to seed data, it must be done within the test block.
 */

describe('providers > dynamo > dynaModel', () => {
  describe('makeGetAll', () => {
    describe('without seed', () => {
      it('function returns empty array', async () => {
        await expect(makeGetAll()())
          .resolves.toEqual([])
      })
    })
    describe('with seed', () => {
      it('function returns all records', async () => {
        await ddb.put({ TableName, Item }).promise()
        await expect(makeGetAll()())
          .resolves.toEqual(
            expect.arrayContaining([
              expect.objectContaining(Key)
            ])
          )
      })
    })
  })
  describe('makeGet', () => {
    it('function gets record matching hash key', async () => {
      await ddb.put({ TableName, Item }).promise()
      await expect(makeGet()(Key))
        .resolves.toEqual(Item)
    })
  })
  describe('makeGetMeta', () => {
    it('function gets key and meta attributes only', async () => {
      const createdAt = new Date().toISOString()
      const updatedAt = new Date().toISOString()
      await ddb.put({ TableName, Item: { ...Item, createdAt, updatedAt } }).promise()
      await expect(makeGetMeta()(Key))
        .resolves.toEqual({ ...Key, createdAt, updatedAt })
    })
  })
  describe('makeGetProperty', () => {
    it('function gets property on record matching hash key', async () => {
      await ddb.put({ TableName, Item }).promise()
      await expect(makeGetProperty('test')(Key))
        .resolves.toEqual(Item.test)
    })
    it('function gets undefined at path on record matching hash key without record', async () => {
      await expect(makeGetProperty('test')(Key))
        .resolves.toEqual(undefined)
    })
    it('function gets property at nested path on record matching hash key', async () => {
      await ddb.put({ TableName, Item: { ...Item, testData: { foo: true } } }).promise()
      await expect(makeGetProperty('testData.foo')(Key))
        .resolves.toEqual(true)
    })
    it('function gets undefined at path on record matching hash key without value', async () => {
      await ddb.put({ TableName, Item }).promise()
      await expect(makeGetProperty('testCount')(Key))
        .resolves.toEqual(undefined)
    })
  })
  describe('makeRemove', () => {
    it('function removes a record by ID, returning deleted item', async () => {
      await ddb.put({ TableName, Item }).promise()
      const deleted = await makeRemove()(Key)
      const found = await ddb.get({ TableName, Key }).promise()
      expect(deleted).toEqual(Item)
      expect(found.Item).toEqual(undefined)
    })
    it('function returns undefined for if no record exits', async () => {
      const deleted = await makeRemove()(Key)
      expect(deleted).toEqual(undefined)
    })
  })
  describe('makeInsertProperty', () => {
    describe('with root property', () => {
      describe('without options (attribute mode)', () => {
        it('without existing item, function creates item and property, sets meta, returns value', async () => {
          const inserted = await makeInsertProperty('testData')(Key, { foo: true })
          const found = await ddb.get({ TableName, Key }).promise()
          expect(inserted)
            .toEqual({ foo: true })
          expect((found.Item as TestProps))
            .toEqual({ ...Key, testData: { foo: true }, ...expectMeta })
        })
        it('without existing prop, function sets property and returns value', async () => {
          await ddb.put({ TableName, Item }).promise()
          await expect(makeInsertProperty('testData')(Key, { foo: true }))
            .resolves.toEqual({ foo: true })
        })
        it('with existing prop, function does nothing, returns existing', async () => {
          await ddb.put({ TableName, Item: { ...Item, testData: { foo: false } } }).promise()
          const inserted = await makeInsertProperty('testData')(Key, { foo: true })
          const found = await ddb.get({ TableName, Key }).promise()
          expect(inserted)
            .toEqual({ foo: false })
          expect((found.Item as TestProps).testData)
            .toEqual({ foo: false })
        })
      })
      describe('with options (item mode)', () => {
        it('without existing item, function creates item and property, sets meta, returns item', async () => {
          const inserted = await makeInsertProperty('testData', 'Item')(Key, { foo: true })
          const found = await ddb.get({ TableName, Key }).promise()
          expect(inserted)
            .toEqual({ ...Key, testData: { foo: true }, ...expectMeta })
          expect((found.Item as TestProps))
            .toEqual({ ...Key, testData: { foo: true }, ...expectMeta })
        })
        it('without existing prop, function sets property (and meta) and returns item', async () => {
          await ddb.put({ TableName, Item }).promise()
          const inserted = await makeInsertProperty('testData', 'Item')(Key, { foo: true })
          expect(inserted as TestProps)
            .toEqual({ ...Item, testData: { foo: true }, ...expectMeta })
        })
        it('with existing prop, function does nothing, returns existing item', async () => {
          await ddb.put({ TableName, Item: { ...Item, testData: { foo: false } } }).promise()
          const inserted = await makeInsertProperty('testData', 'Item')(Key, { foo: true })
          const found = await ddb.get({ TableName, Key }).promise()
          expect(inserted)
            .toEqual({ ...Item, testData: { foo: false }, ...expectMeta })
          expect((found.Item as TestProps).testData)
            .toEqual({ foo: false })
        })
      })
    })
    describe('with nested property', () => {
      describe('without options (attribute mode)', () => {
        it('without parent, function creates parent, sets default, returns value', async () => {
          await ddb.put({ TableName, Item }).promise()
          const inserted = await makeInsertProperty('testData.foo')(Key, true)
          const found = await ddb.get({ TableName, Key }).promise()
          expect(inserted)
            .toEqual(true)
          expect((found.Item as TestProps).testData)
            .toEqual({ foo: true })
        })
        it('with parent, with existing prop, function does nothing, returning existing', async () => {
          await ddb.put({ TableName, Item: { ...Item, testData: { foo: true, bar: false } } }).promise()
          const existing = await makeInsertProperty('testData.bar')(Key, true)
          const found = await ddb.get({ TableName, Key }).promise()
          expect(existing)
            .toEqual(false)
          expect((found.Item as TestProps).testData)
            .toEqual({ foo: true, bar: false })
        })
        it('with parent, without existing prop, function sets default, returning value', async () => {
          await ddb.put({ TableName, Item: { ...Item, testData: { foo: true } } }).promise()
          const inserted = await makeInsertProperty('testData.bar')(Key, false)
          const found = await ddb.get({ TableName, Key }).promise()
          expect((found.Item as TestProps).testData)
            .toEqual({ foo: true, bar: false })
          expect(inserted)
            .toEqual(false)
        })
        it('with parent, without existing prop or nesting, function adds nesting, returns value, makes only two requests', async () => {
          await ddb.put({ TableName, Item: { ...Item, testData: { foo: true } } }).promise()
          const inserted = await makeInsertProperty('testData.baz.qux')(Key, false)
          const found = await ddb.get({ TableName, Key }).promise()
          expect((found.Item as TestProps).testData)
            .toEqual({ foo: true, baz: { qux: false } })
          expect(inserted)
            .toEqual(false)
        })
      })
      describe('with options (item mode)', () => {
        it('sets value at path, returns item including meta attributes', async () => {
          await ddb.put({ TableName, Item }).promise()
          const inserted = await makeInsertProperty('testData.foo', 'Item')(Key, true)
          const found = await ddb.get({ TableName, Key }).promise()
          expect(inserted)
            .toEqual({ ...Item, testData: { foo: true }, ...expectMeta })
          expect(found.Item)
            .toEqual({ ...Item, testData: { foo: true }, ...expectMeta })
        })
      })
    })
    describe('with subsequent updates', () => {
      it('maintains original created date', async () => {
        const inserted = await makeInsertProperty('testData', 'Item')(Key, { foo: true })
        const updated = await makeInsertProperty('testData', 'Item')(Key, { foo: false })
        const found = await ddb.get({ TableName, Key }).promise()
        expect(inserted.createdAt).toEqual(updated.createdAt)
        expect(inserted.createdAt).toEqual(found?.Item?.createdAt)
      })
      it('updates original updated date', async () => {
        const inserted = await makeInsertProperty('testData', 'Item')(Key, { foo: true })
        const updated = await makeInsertProperty('testData', 'Item')(Key, { foo: false })
        const found = await ddb.get({ TableName, Key }).promise()
        expect(inserted.updatedAt).not.toEqual(updated.updatedAt)
        expect(updated.updatedAt).toEqual(found?.Item?.updatedAt)
      })
    })
  })
  describe('makeUpdateProperty', () => {
    it('functions assign to objects without effecting other properties', async () => {
      await ddb.put({ TableName, Item }).promise()
      await makeUpdateProperty('testData.foo')(Key, false)
      await makeUpdateProperty('testData.bar')(Key, false)
      const found = await ddb.get({ TableName, Key }).promise()
      expect((found.Item as TestProps).testData)
        .toEqual({
          foo: false,
          bar: false
        })
    })
    describe('with subsequent updates', () => {
      it('maintains original created date', async () => {
        const inserted = await makeUpdateProperty('testData.foo', 'Item')(Key, true)
        const updated = await makeUpdateProperty('testData.bar', 'Item')(Key, false)
        const found = await ddb.get({ TableName, Key }).promise()
        expect(inserted.createdAt).toEqual(updated.createdAt)
        expect(inserted.createdAt).toEqual(found?.Item?.createdAt)
      })
      it('updates original updated date', async () => {
        const inserted = await makeUpdateProperty('testData.foo', 'Item')(Key, true)
        const updated = await makeUpdateProperty('testData.bar', 'Item')(Key, false)
        const found = await ddb.get({ TableName, Key }).promise()
        expect(inserted.updatedAt).not.toEqual(updated.updatedAt)
        expect(updated.updatedAt).toEqual(found?.Item?.updatedAt)
      })
    })
    describe('without options (attribute mode)', () => {
      it('function assigns a property, returning changes', async () => {
        await expect(makeUpdateProperty('testCount')(Key, 99))
          .resolves.toEqual(99)
      })
      it('function assigns nested property, returning changes', async () => {
        await expect(makeUpdateProperty('testData.foo')(Key, true))
          .resolves.toEqual(true)
      })
      it('function updates a property, returning changes', async () => {
        await ddb.put({ TableName, Item: { ...Item, testCount: 1 } }).promise()
        await expect(makeUpdateProperty('testCount')(Key, 99))
          .resolves.toEqual(99)
      })
      it('function updates nested property, returning changes', async () => {
        await ddb.put({ TableName, Item: { ...Item, testData: { foo: false } } }).promise()
        await expect(makeUpdateProperty('testData.foo')(Key, true))
          .resolves.toEqual(true)
      })
    })
    describe('with options (item mode)', () => {
      it('function assigns a property, returning item', async () => {
        await expect(makeUpdateProperty('testCount', 'Item')(Key, 99))
          .resolves.toEqual({ ...Key, testCount: 99, ...expectMeta })
      })
      it('function assigns nested property, returning item', async () => {
        await expect(makeUpdateProperty('testData.foo', 'Item')(Key, true))
          .resolves.toEqual({ ...Key, testData: { foo: true }, ...expectMeta })
      })
      it('function updates a property, returning item', async () => {
        await ddb.put({ TableName, Item: { ...Item, testCount: 1 } }).promise()
        await expect(makeUpdateProperty('testCount', 'Item')(Key, 99))
          .resolves.toEqual({ ...Item, testCount: 99, ...expectMeta })
      })
      it('function updates nested property, returning item', async () => {
        await ddb.put({ TableName, Item: { ...Item, testData: { foo: false } } }).promise()
        await expect(makeUpdateProperty('testData.foo', 'Item')(Key, true))
          .resolves.toEqual({ ...Item, testData: { foo: true }, ...expectMeta })
      })
    })
  })
  /** @todo Below for manual IDE type checking only. Need better tests for types; DTS-Jest? */
  describe.skip('return types', () => {
    it('updates return prop type', () => {
      const getString = makeGetProperty('test') // eslint-disable-line
      type ReturnStringConditional = ReturnType<typeof getString> // eslint-disable-line
      // ☝️ expect: Promise<string | undefined>

      const updateNumber = makeUpdateProperty('testCount') // eslint-disable-line
      type ReturnNumber = ReturnType<typeof updateNumber> // eslint-disable-line
      // ☝️ expect: Promise<number>

      const setNull = makeInsertProperty('nullable') // eslint-disable-line
      type AssignNull = Parameters<typeof setNull>[1] // eslint-disable-line
      // ☝️ expect: null
      type ReturnNull = ReturnType<typeof setNull> // eslint-disable-line
      // ☝️ expect: Promise<boolean>

      // const deleteNull = makeDeleteProperty<{ foo: null }>('foo') // eslint-disable-line
      // type ReturnNullConditional = ReturnType<typeof deleteNull> // eslint-disable-line
      // // ☝️ expect: Promise<null | undefined>

      expect(true).toBeTruthy()
    })
    it('non-property methods return whole item', () => {
      const getItem = makeGet()
      const delItem = makeGet()
      type ItemReturn = ReturnType<typeof getItem> | ReturnType<typeof delItem> // eslint-disable-line
      // ☝️ expect: Promise<Item<Props> | undefined>

      const getAllItems = makeGetAll()
      type ItemsReturn = ReturnType<typeof getAllItems> // eslint-disable-line
      // ☝️ expect: Promise<Item<Props>>[]

      expect(true).toBeTruthy()
    })
  })
})
