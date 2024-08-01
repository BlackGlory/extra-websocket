# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.4.1](https://github.com/BlackGlory/extra-websocket/compare/v0.4.0...v0.4.1) (2024-08-01)


### Features

* improve `connect` ([b96fa33](https://github.com/BlackGlory/extra-websocket/commit/b96fa33eaadabec67140e356274c64913b1af6a2))

## [0.4.0](https://github.com/BlackGlory/extra-websocket/compare/v0.3.2...v0.4.0) (2023-12-08)


### ⚠ BREAKING CHANGES

- CommonJS => ESM
- The minimal Node.js is v18.17.0
- Modified the signature of `ExtraWebSocket#send`

* upgrade dependencies ([a59f9b8](https://github.com/BlackGlory/extra-websocket/commit/a59f9b8f67a4423dcb304006fac70defbc5f7484))

### [0.3.2](https://github.com/BlackGlory/extra-websocket/compare/v0.3.1...v0.3.2) (2023-06-11)


### Bug Fixes

* export src ([e492f08](https://github.com/BlackGlory/extra-websocket/commit/e492f08e4eb31b02b2cea999c92ed1f9fe3041c6))

### [0.3.1](https://github.com/BlackGlory/extra-websocket/compare/v0.3.0...v0.3.1) (2022-08-01)

## [0.3.0](https://github.com/BlackGlory/extra-websocket/compare/v0.2.5...v0.3.0) (2022-06-08)


### ⚠ BREAKING CHANGES

* addEventListener, removeEventListener are removed

* use Emitter from @blackglory/structures ([1858862](https://github.com/BlackGlory/extra-websocket/commit/1858862bfa5a0d709dc4a87a8c122da4e12eb479))

### [0.2.5](https://github.com/BlackGlory/extra-websocket/compare/v0.2.4...v0.2.5) (2022-06-08)

### [0.2.4](https://github.com/BlackGlory/extra-websocket/compare/v0.2.3...v0.2.4) (2022-06-03)


### Features

* add autoReonnectWithExponentialBackOff ([4e16480](https://github.com/BlackGlory/extra-websocket/commit/4e16480c0e0dd53ac2d9a726944f7f10cf25d3e0))

### [0.2.3](https://github.com/BlackGlory/extra-websocket/compare/v0.2.2...v0.2.3) (2022-06-02)


### Bug Fixes

* **autoReonnect:** remove the close event listener before reconnection ([215df18](https://github.com/BlackGlory/extra-websocket/commit/215df188257f7a7ef9f12b200325826141dffc97))

### [0.2.2](https://github.com/BlackGlory/extra-websocket/compare/v0.2.1...v0.2.2) (2022-06-02)


### Features

* **autoReonnect:** add an error listener ([8381d8b](https://github.com/BlackGlory/extra-websocket/commit/8381d8ba6ff2b75a3268d542f40c38b0e07c21e4))

### [0.2.1](https://github.com/BlackGlory/extra-websocket/compare/v0.2.0...v0.2.1) (2022-05-31)


### Bug Fixes

* dependencies ([3ea0c6e](https://github.com/BlackGlory/extra-websocket/commit/3ea0c6e0255088e2544453548033db07113bbfd0))

## [0.2.0](https://github.com/BlackGlory/extra-websocket/compare/v0.1.0...v0.2.0) (2022-05-31)


### ⚠ BREAKING CHANGES

* previously unsent messages will be sent after connecting.

### Features

* previously unsent messages will be sent after connecting ([65c5236](https://github.com/BlackGlory/extra-websocket/commit/65c5236f966a2df72bd099b598f800b604551d24))

## 0.1.0 (2022-05-30)


### Features

* init ([86ee1fd](https://github.com/BlackGlory/extra-websocket/commit/86ee1fd768dd68f7ccea3be04b32fc009beaa76e))
