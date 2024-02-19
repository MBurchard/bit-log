# bit-log: Yet another logging library for Typescript (and Javascript)

![lang: Typescript](https://img.shields.io/badge/crafted_with-Typescript-blue?logo=typescript)
![GitHub License](https://img.shields.io/github/license/mburchard/bit-log)
![CI: GitHub](https://github.com/MBurchard/bit-log/actions/workflows/ci.yml/badge.svg)
[![Codecov](https://img.shields.io/codecov/c/gh/mburchard/bit-log?logo=codecov)](https://app.codecov.io/gh/MBurchard/bit-log)
![NPM Version](https://img.shields.io/npm/v/%40mburchard%2Fbit-log?logo=npm)

## Usage

```javascript
const log = useLog('foo.bar');
log.debug('Here we are, a debug log');
log.info('Here we are, a debug log');
try {
  //...
} catch (e) {
  log.error('error in method ...', e);
}
```

## Todo

  - [ ] Documentation
  - [ ] FileAppender
  - [ ] improve log output
