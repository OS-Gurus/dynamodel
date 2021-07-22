# DynaModel

Generate typed methods for DynamoDB models. With special sauce for nested props.

---

![CI](https://github.com/OS-Gurus/dynamodel/actions/workflows/push.yml/badge.svg)
![Release](https://github.com/OS-Gurus/dynamodel/actions/workflows/merge.yml/badge.svg)
[![npm version](https://badge.fury.io/js/%40os-gurus%2Fdynamodel.svg)](https://badge.fury.io/js/%40os-gurus%2Fdynamodel)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

---

```ts
import dynaModel from '@os-gurus/dynamodel'

const ddb = new DynamoDB.DocumentClient({ region: 'us-east-1' })
const table = `learning-focus-user-data-${process.env.STAGE}`
const {
  makeGet,
  makeGetAll,
  makeGetProperty,
  makeUpdateProperty
} = dynaModel(ddb, table)

type UserData = {
  name: string
  address: {
    country: string
  }
}

export const userModel = {
  getUser: makeGet<UserModel>(),
  getUserName: makeGetProperty<UserModel>('name'),
  updateUserCountry: makeUpdateProperty<UserModel>('address.country')
}
```

That's all the docs I've got time for right now sorry. Try it out. The types are nice.
