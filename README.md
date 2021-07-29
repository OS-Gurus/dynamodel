# DynaModel

Generate typed methods for DynamoDB models. With special sauce for nested props.

---

![CI](https://github.com/OS-Gurus/dynamodel/actions/workflows/push.yml/badge.svg)
![Release](https://github.com/OS-Gurus/dynamodel/actions/workflows/merge.yml/badge.svg)
[![npm version](https://badge.fury.io/js/%40os-gurus%2Fdynamodel.svg)](https://badge.fury.io/js/%40os-gurus%2Fdynamodel)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

---

### Updating Nested Properties

DynaModel utility functions are instantiated with your DB connection, table and its items type, e.g.

```ts
import { dynaModel } from '@os-gurus/dynamodel'

const ddb = new DynamoDB.DocumentClient({ region: 'us-east-1' })

type HashKeys = { id: string }
type Props = { address: { country: string } }

const { makeUpdateProperty } = dynaModel<HashKeys, Props>(ddb, 'user-meta')

function updateUserCountry (id: string, country: string) {
  const update = makeUpdateProperty('address.country')
  // property paths are typed and autocomplete ☝️
  return update({ id }, country)
  // returns updated value ☝️ typed as `string`, arguments are also typed
}
```

When making updates to nested properties, first it will attempt to set the value at the given path,
but if the parent doesn't exist it will go recursively upward to create the parent object.

This approach will amortize the cost of requests, as only the first update will result in multiple
requests, subsequent updates will just set the nested property and return.

In the instance of setting `address.country` where no `address` exists on the item, it would update
`address` to `{ country: 'AU' }`. The next request would just set `address.country` to `AU`.

### Examples

```ts
import { dynaModel } from '@os-gurus/dynamodel'

const ddb = new DynamoDB.DocumentClient({ region: 'us-east-1' })
const table = `service-user-data-${process.env.STAGE}`

type UserKeys = {
  userId: string
}
type UserData = {
  name: string
  address: {
    country: string
  }
}

const usersDB = dynaModel<UserKeys, UserData>(ddb, table)

export const userModel = {
  getUser: usersDB.makeGet(),
  getUserName: usersDB.makeGetProperty('name'),
  updateUserName: usersDB.makeUpdateProperty('name'),
  updateUserCountry: usersDB.makeUpdateProperty('address.country'),
  setDefaultCountry: usersDB.makeInsertProperty('address.country')
}
```

That's all the docs I've got time for right now sorry. Try it out. The types are nice.
