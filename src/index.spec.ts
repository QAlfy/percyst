import * as date from 'mockdate';
import configureStore from 'redux-mock-store';
import { curryN } from 'ramda';
import {
  decrypt,
  deserialize,
  encrypt,
  futureDate,
  LOCAL_STORAGE_KEY,
  localStorage,
  Percyst,
  serialize
} from './index';

const ENCRYPT_SECRET = 'secret';
const ENCRYPT_STRING = 'test';

// setup mocked Redux store
let store;

const addTodo = (): any => ({
  type: 'ADD_TODO',
  payload: 'This is some OLD bogus payload'
});
const mockedReducer = (): any => {
  const actions = store.getActions();
  const lastAction = actions[actions.length - 1];

  if (lastAction.type === 'ADD_TODO') {
    const newPayload = lastAction.payload.replace('OLD', 'NEW');

    return { todo: newPayload, ignored: 'I might be ignored' };
  }

  return {};
};
const mockStore = curryN(1, configureStore);

// begin tests
describe('encryption', () => {
  test('it can encrypt and decrypt', () => {
    const encrypted = encrypt(ENCRYPT_STRING, ENCRYPT_SECRET);
    const decrypted = decrypt(encrypted, ENCRYPT_SECRET);

    expect(decrypted).toEqual(ENCRYPT_STRING);
  });
});

describe('serialization', () => {
  test('it can serialize and deserialize', () => {
    const serialized = serialize(addTodo());
    const deserialized = deserialize(serialized);

    expect(deserialized).toEqual(addTodo());
  });
});

describe('Redux store without encryption', () => {
  const percyst = new Percyst({
    ignore: ['ignored']
  });

  // initialize mockstore with pseudo reducer
  beforeAll(() => {
    localStorage.clear();

    const middlewares = [percyst.middleware];

    store = mockStore(middlewares)(mockedReducer);
  });

  test('it can dispatch an action', () => {
    // dispatch the action
    store.dispatch(addTodo());

    const actions = store.getActions();

    expect(actions).toEqual([addTodo()]);
  });

  test('it can store the newest state', () => {
    // at this point, percyst should have stored the state
    expect(localStorage).toHaveProperty(LOCAL_STORAGE_KEY);

    const serializedState = localStorage[LOCAL_STORAGE_KEY];
    const deserializedState = deserialize(serializedState);

    expect(deserializedState).toHaveProperty('todo');
    expect(deserializedState['todo']).toEqual(
      'This is some NEW bogus payload'
    )
  });

  test('it should have ignored some keys', () => {
    const serializedState = localStorage[LOCAL_STORAGE_KEY];
    const deserializedState = deserialize(serializedState);

    expect(deserializedState).not.toHaveProperty('ignored');
  });

  test('rehydration should restore state and merge with initial state',
    () => {
      const rehydrated = percyst.rehydrate({ initial: 'initial key/value' });

      expect(rehydrated).toHaveProperty('todo');
      expect(rehydrated).toHaveProperty('initial');
    }
  );
});

describe('Redux store with encryption', () => {
  const percyst = new Percyst({
    encryptSecret: ENCRYPT_SECRET
  });

  // initialize mockstore with pseudo reducer
  beforeAll(() => {
    localStorage.clear();

    const middlewares = [percyst.middleware];

    store = mockStore(middlewares)(mockedReducer);
  });

  test('it can dispatch an action', () => {
    // dispatch the action
    store.dispatch(addTodo());

    const actions = store.getActions();

    expect(actions).toEqual([addTodo()]);
  });

  test('it can store the newest state via encryption', () => {
    // at this point, Percyst should have stored the state
    expect(localStorage).toHaveProperty(LOCAL_STORAGE_KEY);

    const encryptedState = localStorage[LOCAL_STORAGE_KEY];
    const deserializedState = decrypt(encryptedState, ENCRYPT_SECRET);

    expect(deserializedState).toHaveProperty('todo');
    expect(deserializedState['todo']).toEqual(
      'This is some NEW bogus payload'
    )
  });

  test('rehydration should restore encrypted state and merge with \
  initial state',
    () => {
      const rehydrated = percyst.rehydrate({ initial: 'initial key/value' });

      expect(rehydrated).toHaveProperty('todo');
      expect(rehydrated).toHaveProperty('initial');
    }
  );

  test('rehydration with encryption should work on null state',
    () => {
      localStorage.clear();

      const rehydrated = percyst.rehydrate({ initial: 'initial key/value' });

      expect(rehydrated).toHaveProperty('initial');
    }
  );
});

describe('Redux store with TTL', () => {
  const ttl = 2000; // 2 seconds
  const percyst = new Percyst({ ttl });

  // initialize mockstore with pseudo reducer
  beforeAll(() => {
    date.reset();

    localStorage.clear();

    const middlewares = [percyst.middleware];

    store = mockStore(middlewares)(mockedReducer);
  });

  test('it can dispatch an action', () => {
    // dispatch the action
    store.dispatch(addTodo());

    const actions = store.getActions();

    expect(actions).toEqual([addTodo()]);
  });

  test('stored state expires if ttl is exceeded', async () => {
    // travel to the future ahead of TTL
    date.set(futureDate(ttl * 1.5, new Date()));

    const rehydrated = percyst.rehydrate();

    expect(rehydrated).toEqual({});
    date.reset();
  });

  test('stored state does not expire if ttl is not exceeded', async () => {
    // travel to the future, just a bit this time
    date.set(futureDate(500, new Date()));

    const rehydrated = percyst.rehydrate();

    expect(rehydrated).not.toEqual({});

    date.reset();
  });
});
