# Changelog

## [0.3.0](https://github.com/puiusabin/fumi/compare/fumi-v0.2.0...fumi-v0.3.0) (2026-03-01)


### Features

* replace smtp-server with bun-smtp ([aac67c7](https://github.com/puiusabin/fumi/commit/aac67c76d3c46bd52d4c2595323af1aa1325f883))


### Bug Fixes

* resolve biome and tsc failures ([7c32d7e](https://github.com/puiusabin/fumi/commit/7c32d7ee1d20a52a224c2b949d87b2d5deec5285))

## [0.2.0](https://github.com/puiusabin/fumi/compare/fumi-v0.1.0...fumi-v0.2.0) (2026-03-01)


### Features

* add denylist plugin ([0304ff0](https://github.com/puiusabin/fumi/commit/0304ff0fde2b345da3dd40ee1fe3118232e3cf91))
* add listen and close lifecycle methods ([2b96c66](https://github.com/puiusabin/fumi/commit/2b96c6612fa1c8bd1420757119420864154b3c89))
* add logger plugin ([c49b1d7](https://github.com/puiusabin/fumi/commit/c49b1d76cbe1060b1fd91cc338f34ec9b30eb60c))
* add max-size plugin ([54e7db1](https://github.com/puiusabin/fumi/commit/54e7db1550a58add94ca69bcdec681bf21eea207))
* add middleware composer ([abd8646](https://github.com/puiusabin/fumi/commit/abd86469c3101bf49eb6f901e7cc530747d69755))
* add rcpt-filter plugin ([bc12c8a](https://github.com/puiusabin/fumi/commit/bc12c8acd0093c5073c0381901b1299db0a36e69))
* add requireTLS option and plugin ([488acea](https://github.com/puiusabin/fumi/commit/488acea31773bdfc6b0049415698828d93d99225))
* add sender-block plugin ([f6c8ed4](https://github.com/puiusabin/fumi/commit/f6c8ed4920d0ee22473434879507f90b0c03bd2f))
* define core SMTP types and interfaces ([6bc4bf6](https://github.com/puiusabin/fumi/commit/6bc4bf6c9f43b62b47d2a1d091d5917a9995a456))
* **docs:** add configuration reference page ([9276388](https://github.com/puiusabin/fumi/commit/9276388b48146a2f994f3f98f8b234c08aa7ff51))
* **docs:** register Step and Steps MDX components ([b19fceb](https://github.com/puiusabin/fumi/commit/b19fceb929467f25303675e63e3b61d5b878c565))
* **docs:** set clerk TOC style ([be50190](https://github.com/puiusabin/fumi/commit/be50190c83e59578827aa90a89b6cb9faff37081))
* **docs:** use svg for logo and add jacques francois font ([0dd163a](https://github.com/puiusabin/fumi/commit/0dd163a2737cdf3980d75fb95c68fc963caf2f81))
* expose public API from package entry point ([f65ca5c](https://github.com/puiusabin/fumi/commit/f65ca5c864005a190f99a36a2dd12e2727f42443))
* scaffold entry point ([f10f2bb](https://github.com/puiusabin/fumi/commit/f10f2bbe9a887b10a417635b0bb5a837d4d85559))
* scaffold Fumi class with SMTP phase hooks ([035e37b](https://github.com/puiusabin/fumi/commit/035e37bbe95b3303a111daa9d14c895525af7208))
* wire connect and auth hooks into smtp-server ([8b230db](https://github.com/puiusabin/fumi/commit/8b230db538327ba4ef37525d417a183c333908f2))
* wire mail envelope and data hooks into smtp-server ([c64f37a](https://github.com/puiusabin/fumi/commit/c64f37a16e650213f57db834d24d919bc32dba53))


### Bug Fixes

* **biome:** exclude docs from root config to avoid nested root conflict ([9c61bb5](https://github.com/puiusabin/fumi/commit/9c61bb599647cfd8a4986dee2ace7583a8091aa5))
* eliminate non-null assertions using local variable ([2ee139a](https://github.com/puiusabin/fumi/commit/2ee139aa4e655f098857df027e2d19575c8f7b08))
* exclude docs from root tsconfig, move build badge first ([660ac7f](https://github.com/puiusabin/fumi/commit/660ac7f3e6acdfbe3ca11eb9369a047c82776a8c))
* guard array access against noUncheckedIndexedAccess ([36a2c73](https://github.com/puiusabin/fumi/commit/36a2c73f77a126cd1ea3bf6772b297859019286b))
* replace resolves and rejects with explicit await patterns ([04a249e](https://github.com/puiusabin/fumi/commit/04a249ececeaf22787092754fe8fc7cc3345b36e))
* use perl instead of sed for cross-platform .d.ts rewrite ([bcbe7e8](https://github.com/puiusabin/fumi/commit/bcbe7e8143c1d64d2072b31c7a3498453b4fa1eb))
* use ts-expect-error over ts-ignore ([7285912](https://github.com/puiusabin/fumi/commit/72859124c42c187d0df8b7dd4357bed59fc46fe5))


### Performance Improvements

* **core:** skip handler registration for empty middleware chains ([5a25993](https://github.com/puiusabin/fumi/commit/5a2599307a356a79ed64e407e43319cc193cf6bf))
