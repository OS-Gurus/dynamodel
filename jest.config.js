const tsPreset = require('ts-jest/jest-preset')
const ddbPreset = require('jest-dynalite/jest-preset')

module.exports = {
  ...tsPreset,
  ...ddbPreset,
  roots: ['<rootDir>/src']
}
