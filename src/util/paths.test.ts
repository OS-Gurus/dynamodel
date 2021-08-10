import { atPath } from './paths'

const testObj = {
  foo: true,
  bar: false,
  one: 1,
  two: undefined,
  a: {
    b: {
      c: true
    }
  }
}

describe('util > atPath', () => {
  it('gets value of property', () => {
    expect(atPath(testObj, 'foo'))
      .toEqual(testObj.foo)
  })
  it('gets falsy value of property', () => {
    expect(atPath(testObj, 'bar'))
      .toEqual(testObj.bar)
  })
  it('gets object value of property', () => {
    expect(atPath(testObj, 'a'))
      .toEqual(testObj.a)
  })
  it('gets undefined property', () => {
    expect(atPath(testObj, 'two'))
      .toEqual(testObj.two)
  })
  it('gets deeply nested values', () => {
    expect(atPath(testObj, 'a.b.c'))
      .toEqual(testObj.a.b.c)
  })
  it('gets undefined property on empty object', () => {
    expect(atPath({} as typeof testObj, 'foo'))
      .toEqual(undefined)
  })
})
