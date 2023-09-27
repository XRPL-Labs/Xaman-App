# Testing

## Unit tests
`make test` runs the unit test suite.

Our tests are written using [Jest](https://facebook.github.io/jest/).

To write a test, place a Javascript file with the `.test.ts` suffix in the
`__tests__` directory inside of any subfolder of `/src`. The test will be
automatically picked up by the test runner.

## End to End tests
`make test-e2e` runs Gray box end-to-end tests

Our tests are written using [Detox](https://github.com/wix/Detox).

To write a test, place a Javascript file with the `.spec.js` suffix in the
`e2e` directory inside root directory. The test will be
automatically picked up by the test runner.

## Type checking with TypeScript
Use [Typescript](https://www.typescriptlang.org/) to find and prevent type related issues.

## Linting
`make check-style` checks the codebase against our linting rules. We're using
the AirBnB [ES6](https://github.com/airbnb/javascript) and [React](https://github.com/airbnb/javascript/tree/master/react) style guides.


## Cosoms

- Run cosmos server
```bash
npm run cosmos
```

- Uncomment following line in `<rootDir>/index.js`
```js
import './.cosmos/cosmos.app';
```

- Comment out all other lines and Start your application again

