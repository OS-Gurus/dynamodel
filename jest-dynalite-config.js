module.exports = {
  tables: [
    {
      TableName: 'test-data',
      KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'userId', AttributeType: 'S' }],
      ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
      // data: [{ userId: 'test_userId' }],
    }
  ],
  basePort: 8000
}
