const tsPreset = require('ts-jest/jest-preset')
const ddbPreset = require('jest-dynalite/jest-preset')

module.exports = {
  roots: ['<rootDir>/src'],
  ...tsPreset,
  ...ddbPreset
}
