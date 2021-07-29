import {
  attributeNames,
  updateExpression,
  insertExpression,
  nestedValue,
  updateValues
} from './expressions'

describe('providers > dynamo > util > expressions', () => {
  describe('attributeNames', () => {
    it('returns map of expression attribute names for parts of a path', () => {
      expect(attributeNames(['foo', 'bar', 'baz']))
        .toEqual({
          '#foo': 'foo',
          '#bar': 'bar',
          '#baz': 'baz'
        })
    })
  })
  describe('updateExpression', () => {
    it('returns string expression to set nested values at path', () => {
      expect(updateExpression(['foo', 'bar', 'baz']))
        .toEqual('#foo.#bar.#baz = :value')
    })
  })
  describe('insertExpression', () => {
    it('returns string expression to insert values at nested path', () => {
      expect(insertExpression(['foo', 'bar']))
        .toEqual('#foo.#bar = if_not_exists(#foo.#bar, :value)')
    })
    it('returns string expression to insert values on non-nested property', () => {
      expect(insertExpression(['foo']))
        .toEqual('#foo = if_not_exists(#foo, :value)')
    })
  })
  describe('nestedValue', () => {
    it('returns object structure with value set at given path', () => {
      expect(nestedValue(['foo', 'bar', 'baz'], 'testing'))
        .toEqual({ foo: { bar: { baz: 'testing' } } })
    })
    it('returns assigned value for non-nested property', () => {
      expect(nestedValue(['foo'], 'testing'))
        .toEqual({ foo: 'testing' })
    })
  })
  describe('updateValues', () => {
    it('assigns value at given path', () => {
      expect(updateValues(['foo', 'bar'], { foo: { bar: true } }))
        .toEqual({ ':value': true })
    })
  })
})
