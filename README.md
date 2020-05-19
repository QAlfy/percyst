<h1 align="center">Percyst</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-0.1.1-blue.svg?cacheSeconds=2592000" />
  <img alt="Documentation" src="https://img.shields.io/badge/coverage-100-brightgreen.svg" />
  <a href="Copyright <YEAR> <COPYRIGHT HOLDER>" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
  </a>
</p>

> An unopinionated Redux store persistor with optional encryption that works out of the box

### 🏠 [Homepage](https://pidman.qalfy.com)

## Why?

Percyst was created to respond to an urgent need of a Redux middleware which can work right away without fancy or overengineered boilerplate.

After trying couple of other libraries which unnecessarily made that task difficult while at the same time contributed with some units of ugliness to the store initialization procedure, I decided to go on with my own solution.

Now my code looks cleaner and compact.

## About

Percyst will preserve your Redux state using the browser's local storage.

Aditionally, you can choose to encrypt the state using **AES cryptography** without anything else other than setting an additional property. Also, you can choose to _ignore_ some keys from your state to avoid storing them.

## Install

```sh
yarn add percyst
```

or

```sh
npm i percyst
```

## Usage

A quick overview of my current `configureStore.js` file:

```js
import { applyMiddleware, createStore } from "redux";
import { rootReducer } from "../reducers";
import { Percyst } from "percyst";

const percyst = new Percyst();

export default function configureStore(initialState) {
  return createStore(
    rootReducer,
    percyst.rehydrate(initialState),
    applyMiddleware(percyst.middleware)
  );
}
```

After instantiating the `Percyst` object, inject the middleware using the corresponding `middleware` method as shown above. Finally, as a second argument to the Redux's `createStore` utility (\*_preloadedState_), use Percyst's `rehydrate` method along with an optional initial state object.

### Options

Just in case, you can enable encryption or ignore some pieces of your state. Use these options using the `Percyst` constructor:

```js
const percyst = new Percyst({
  ignore: ["loginError"],
  encryptSecret: "p4ssphr4s3",
});
```

| Option          | Type     | Description                                           | Required |
| --------------- | -------- | ----------------------------------------------------- | :------: |
| `ignore`        | _Array_  | A list of keys that will not be saved                 |  **No**  |
| `encryptSecret` | _String_ | Enables encryption of the state using this passphrase |  **No**  |


## Author

👤 **Nicolas Iglesias**

- Website: https://github.com/QAlfy/percyst
- Github: [@webpolis](https://github.com/webpolis)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/QAlfy/percyst/issues).

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

Copyright © 2020 [Nicolas Iglesias](https://github.com/webpolis).<br />
This project is [MIT](https://github.com/QAlfy/percyst/blob/master/LICENSE) licensed.
