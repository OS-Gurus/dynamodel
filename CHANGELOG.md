## [2.0.1](https://github.com/OS-Gurus/dynamodel/compare/v2.0.0...v2.0.1) (2021-10-07)


### Bug Fixes

* expose type utilities in dist ([#8](https://github.com/OS-Gurus/dynamodel/issues/8)) ([8514de8](https://github.com/OS-Gurus/dynamodel/commit/8514de8ab350b6895b51215a263f62ab17cbbf67))

# [2.0.0](https://github.com/OS-Gurus/dynamodel/compare/v1.1.2...v2.0.0) (2021-10-05)


### Features

* add update/insert methods that return item ([#7](https://github.com/OS-Gurus/dynamodel/issues/7)) ([3dc4466](https://github.com/OS-Gurus/dynamodel/commit/3dc4466a8fccda8368863486af4299739e7e553c))


### BREAKING CHANGES

* Projection parameter removed from update/insert methods, which are now different methods instead of branching on parameter. e.g.
  - makeUpdateProperty(id, val, 'Item') == makeUpdateInItem(id, val)
  - makeUpdateProperty(id, val, 'Attributes') == makeUpdateProperty(id, val)

## [1.1.2](https://github.com/OS-Gurus/dynamodel/compare/v1.1.1...v1.1.2) (2021-10-02)


### Bug Fixes

* fix and test makeGetMeta ([#6](https://github.com/OS-Gurus/dynamodel/issues/6)) ([ab88a50](https://github.com/OS-Gurus/dynamodel/commit/ab88a50000dca8b973d636e75456ed5008044b83))

## [1.1.1](https://github.com/OS-Gurus/dynamodel/compare/v1.1.0...v1.1.1) (2021-09-30)


### Bug Fixes

* projection option return type overloads ([#4](https://github.com/OS-Gurus/dynamodel/issues/4)) ([edda206](https://github.com/OS-Gurus/dynamodel/commit/edda206ac334d34ed19be68a968775645b435d6a))

# [1.1.0](https://github.com/OS-Gurus/dynamodel/compare/v1.0.3...v1.1.0) (2021-09-30)


### Features

* add option to return item on prop updates ([#3](https://github.com/OS-Gurus/dynamodel/issues/3)) ([118d326](https://github.com/OS-Gurus/dynamodel/commit/118d326b7f932aa14fcb6a60887f95f193e9a3db))

## [1.0.3](https://github.com/OS-Gurus/dynamodel/compare/v1.0.2...v1.0.3) (2021-08-10)


### Bug Fixes

* performance of type inference at path ([66cdfd0](https://github.com/OS-Gurus/dynamodel/commit/66cdfd0ab3e1fc8fb3fcf6db185254826a87b625))

## [1.0.2](https://github.com/OS-Gurus/dynamodel/compare/v1.0.1...v1.0.2) (2021-07-29)


### Bug Fixes

* definition file size ([490db11](https://github.com/OS-Gurus/dynamodel/commit/490db11faff1ee6c45176bf4df97fc20ce9268a9))
* exports ([2bfd53a](https://github.com/OS-Gurus/dynamodel/commit/2bfd53a752f5b117328b88b2d50053f3864b9a9b))

## [1.0.1](https://github.com/OS-Gurus/dynamodel/compare/v1.0.0...v1.0.1) (2021-07-29)


### Bug Fixes

* add public publish config ([ac3013f](https://github.com/OS-Gurus/dynamodel/commit/ac3013f4370b2956b137423dd6fd38f0452675f1))

# 1.0.0 (2021-07-29)


### Features

* Initial release ([834b696](https://github.com/OS-Gurus/dynamodel/commit/834b696edc7964e78b9d3c0ec6e2e56f1740a585))
* refactor interface ([d8aa5e0](https://github.com/OS-Gurus/dynamodel/commit/d8aa5e0f08b1fac807f4be8b2890bec85511a0a6))

# 1.0.0 (2021-07-29)


### Features

* Initial release ([834b696](https://github.com/OS-Gurus/dynamodel/commit/834b696edc7964e78b9d3c0ec6e2e56f1740a585))
