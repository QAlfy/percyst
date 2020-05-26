import SimpleCrypto from 'simple-crypto-js';
import {
  allPass,
  always,
  call,
  complement,
  compose,
  cond,
  construct,
  constructN,
  converge,
  curryN,
  defaultTo,
  ifElse,
  invoker,
  is,
  isNil,
  lt,
  mergeAll,
  nthArg,
  omit,
  partial,
  pipe,
  prop,
  T
} from 'ramda';

export const LOCAL_STORAGE_KEY = '___percyst';
export const LOCAL_STORAGE_TTL_KEY = '___percyst_ttl';
export const localStorage = window.localStorage;

// some utilities
export const futureDate = compose(
  constructN(1, Date), invoker(1, 'setMilliseconds')
);
export const serialize = curryN(1, JSON.stringify);
export const deserialize = curryN(1, JSON.parse);
export const encrypt = converge(call, [
  pipe(nthArg(0), invoker(1, 'encrypt')),
  pipe(nthArg(1), construct(SimpleCrypto))
]);
export const decrypt = converge(call, [
  pipe(nthArg(0), invoker(1, 'decrypt')),
  pipe(nthArg(1), construct(SimpleCrypto))
]);

export type PercystOptions = {
  /* List of keys to ignore */
  ignore?: Array<string>;
  /**
  * When defined, Percyst will encrypt the state using this option
  * as the encryption key. AES cryptography is used.
  */
  encryptSecret?: string;
  /**
   * If it's defined, this is the amount in milliseconds that the
   * state will remain saved in storage. Useful if it holds session
   * data and you need to logout your users after a specific period.
   */
  ttl?: number;
};

/**
 * Percyst: an unopinionated Redux store persistor with optional encryption.
 */
export class Percyst {
  constructor(private options: PercystOptions = {}) { }

  /**
   * The Percyst middleware to inject with Redux's applyMiddleware.
   *
   * @param  {any} action
   * @returns void
   */
  middleware = store => next => (action: any): void => {
    const actionResult = next(action);
    const nextState = store.getState();
    const serialized = serialize(
      omit(defaultTo([])(this.options.ignore), nextState)
    );
    const encrypted = partial(encrypt, [
      serialized, this.options.encryptSecret
    ]);
    const timestamp = localStorage.getItem(LOCAL_STORAGE_TTL_KEY);

    if (!timestamp) {
      localStorage.setItem(LOCAL_STORAGE_TTL_KEY, String(Date.now()));
    }

    localStorage.setItem(LOCAL_STORAGE_KEY,
      ifElse(is(String), encrypted, always(serialized)
      )(this.options.encryptSecret)
    );

    return actionResult;
  }


  /**
   * Use this method along with a default desired state in order
   * to restore the state persisted by Percyst.
   *
   * To be used with Redux's createStore (preloadedState).
   *
   * @param  {} initialState={}
   * @returns any
   */
  rehydrate(initialState: any = {}): any {
    const isDefined = complement(isNil);
    const persisted = localStorage.getItem(LOCAL_STORAGE_KEY);
    const unencrypted = partial(decrypt, [
      persisted, this.options.encryptSecret
    ]);
    const timestamp = localStorage.getItem(LOCAL_STORAGE_TTL_KEY);
    const hasExpired = allPass([
      pipe(always(this.options.ttl), is(Number)),
      always(call(isDefined, timestamp)),
      always(lt(
        futureDate(this.options.ttl, new Date(Number(timestamp))),
        new Date()
      ))
    ]);

    const restored = cond([
      [
        // if there is a persisted state and encryption is disabled
        allPass([
          pipe(prop('p'), is(String)),
          pipe(prop('k'), isNil),
          complement(hasExpired)
        ]), compose(deserialize, prop('p'))
      ],
      [
        // if there is a persisted state and encryption is enabled
        allPass([
          pipe(prop('p'), isDefined),
          pipe(prop('k'), isDefined),
          complement(hasExpired)
        ]), unencrypted
      ],
      [
        // if there is no persisted state and encryption is disabled
        allPass([
          pipe(prop('p'), isNil),
          pipe(prop('k'), isNil),
          complement(hasExpired)
        ]), always({})
      ],
      // for any other case
      [T, always({})]
    ])({
      p: persisted,
      k: this.options.encryptSecret
    });

    return mergeAll([initialState, restored]);
  }
}
