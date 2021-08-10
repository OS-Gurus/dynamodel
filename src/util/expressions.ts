import { AWSError } from 'aws-sdk'
import { atPaths } from './paths'

export const metaAttributeNames = () => ({
  '#createdAt': 'createdAt',
  '#updatedAt': 'updatedAt'
})

export const metaUpdateExpressions = () => [
  '#createdAt = if_not_exists(#createdAt, :createdAt)',
  '#updatedAt = :updatedAt'
]

export const metaAttributeValues = () => ({
  ':createdAt': new Date().toISOString(),
  ':updatedAt': new Date().toISOString()
})

export const nestedValue = (paths: string[], value: unknown = null) => {
  const openPath = `{ "${paths.join('": { "')}"`
  const closePath = Array.from({ length: paths.length + 1 }).join(' }')
  return JSON.parse(`${openPath}: ${JSON.stringify(value)} ${closePath}`)
}

export const attributeNames = (paths: string[]) =>
  paths.reduce((accumulator, current) => {
    accumulator[`#${current}`] = current
    return accumulator
  }, {} as Record<string, string>)

/** Condition expression to avoid update attempt when parent attribute does not exist. */
export const nestedCondition = (paths: string[]) =>
  (paths.length > 1)
    ? `attribute_exists(#${paths.slice(0, -1).join('.#')})`
    : undefined

/** Update expression that will overwrite existing value. */
export const updateExpression = (paths: string[]) =>
  `#${paths.join('.#')} = :value`

/** Update expression that will not overwrite existing value. */
export const insertExpression = (paths: string[]) =>
  `#${paths.join('.#')} = if_not_exists(#${paths.join('.#')}, :value)`

export const updateValues = (paths: string[], value: unknown) =>
  ({ ':value': atPaths(value, paths) })

/** Get expression to access property at path. */
export const getExpression = (paths: string[]) =>
  `#${paths.join('.#')}`

export const joinExpressions = (operator: 'SET' | 'REMOVE' | 'ADD' | 'DELETE', expressions: string[]) =>
  `${operator} ${expressions.join(', ')}`

export const handleFailedCondition = (err: AWSError) => {
  if (err.code === 'ConditionalCheckFailedException') return
  throw err
}
