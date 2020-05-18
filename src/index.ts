import SimpleCrypto from 'simple-crypto-js';
import {
  always,
  call,
  construct,
  converge,
  curryN,
  defaultTo,
  ifElse,
  invoker,
  is,
  isNil,
  mergeAll,
  nthArg,
  omit,
  partial,
  pipe
} from 'ramda';

export const LOCAL_STORAGE_KEY = '___percyst';
export const localStorage = window.localStorage;

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
  When defined, Percyst will encrypt the state using this option
  as the encryption key.
  */
  encryptSecret?: string;
};

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
   * @returns void
   */
  rehydrate(initialState = {}): void {
    const persisted = localStorage.getItem(LOCAL_STORAGE_KEY);
    const unencrypted = partial(decrypt, [
      persisted, this.options.encryptSecret
    ]);
    const deserialized = ifElse(is(String),
      unencrypted,
      partial(deserialize, [persisted])
    )(
      this.options.encryptSecret
    );

    return ifElse(isNil,
      always(initialState),
      always(
        mergeAll([initialState, deserialized])
      )
    )(persisted);
  }
}
