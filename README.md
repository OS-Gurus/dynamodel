# DynaModel

Generate typed methods for DynamoDB models. With special sauce for nested props.

---

![CI](https://github.com/OS-Gurus/dynamodel/actions/workflows/push.yml/badge.svg)
![Release](https://github.com/OS-Gurus/dynamodel/actions/workflows/merge.yml/badge.svg)
[![npm version](https://badge.fury.io/js/%40os-gurus%2Fdynamodel.svg)](https://badge.fury.io/js/%40os-gurus%2Fdynamodel)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

---

## Updating Nested Properties

DynaModel utility functions are instantiated with your DB connection, table and its items type, e.g.

```ts
import dynaModel from '@os-gurus/dynamodel'

const ddb = new DynamoDB.DocumentClient({ region: 'us-east-1' })

type HashKeys = { id: string }

type UserMeta = { address: { country: string } }

const { updateProperty } = dynaModel<HashKeys>(ddb, 'user-meta').make<UserMeta>()

const updateUserCountry = updateProperty('address.country')
// prop paths are typed and autocomplete ☝️

const updatedCountry = await updateCountry({ id: '111', 'AU' })
// returns the updated country value, typed as `string` ☝️ (arguments are also typed)
```

When making updates to nested properties, first it will attempt to set the value at the given path,
but if the parent doesn't exist it will go recursively upward to create a parent object.

This approach will amortize the cost of requests, as only the first update will result in multiple
requests, subsequent updates will just set the nested property and return.

In the instance of setting `address.country` where no `address` exists on the item, it would update
`address` to `{ country: 'AU' }`. The next request would just set `address.country` to `AU`.

## Examples

```ts
import dynaModel from '@os-gurus/dynamodel'

const ddb = new DynamoDB.DocumentClient({ region: 'us-east-1' })
const table = `service-user-data-${process.env.STAGE}`

type UserData = {
  name: string
  address: {
    country: string
  }
}

const modeller = dynaModel<{ userId: string }>(ddb, table).make<UserData>()

export const userModel = {
  getUser: modeller.get(),
  getUserName: modeller.getProperty('name'),
  updateUserName: modeller.updateProperty('name')
  updateUserCountry: modeller.updateProperty('address.country')
  setDefaultCountry: modeller.insertProperty('address.country')
}
```

That's all the docs I've got time for right now sorry. Try it out. The types are nice.
