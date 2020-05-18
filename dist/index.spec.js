"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redux_mock_store_1 = __importDefault(require("redux-mock-store"));
const ramda_1 = require("ramda");
const index_1 = require("./index");
const ENCRYPT_SECRET = 'secret';
const ENCRYPT_STRING = 'test';
// setup mocked Redux store
let store;
const addTodo = () => ({
    type: 'ADD_TODO',
    payload: 'This is some OLD bogus payload'
});
const mockedReducer = () => {
    const actions = store.getActions();
    const lastAction = actions[actions.length - 1];
    if (lastAction.type === 'ADD_TODO') {
        const newPayload = lastAction.payload.replace('OLD', 'NEW');
        return { todo: newPayload, ignored: 'I might be ignored' };
    }
    return {};
};
const mockStore = ramda_1.curryN(1, redux_mock_store_1.default);
// begin tests
describe('encryption', () => {
    test('it can encrypt and decrypt', () => {
        const encrypted = index_1.encrypt(ENCRYPT_STRING, ENCRYPT_SECRET);
        const decrypted = index_1.decrypt(encrypted, ENCRYPT_SECRET);
        expect(decrypted).toEqual(ENCRYPT_STRING);
    });
});
describe('serialization', () => {
    test('it can serialize and deserialize', () => {
        const serialized = index_1.serialize(addTodo());
        const deserialized = index_1.deserialize(serialized);
        expect(deserialized).toEqual(addTodo());
    });
});
describe('Redux store without encryption', () => {
    const percyst = new index_1.Percyst({
        ignore: ['ignored']
    });
    // initialize mockstore with pseudo reducer
    beforeAll(() => {
        index_1.localStorage.clear();
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
        expect(index_1.localStorage).toHaveProperty(index_1.LOCAL_STORAGE_KEY);
        const serializedState = index_1.localStorage[index_1.LOCAL_STORAGE_KEY];
        const deserializedState = index_1.deserialize(serializedState);
        expect(deserializedState).toHaveProperty('todo');
        expect(deserializedState['todo']).toEqual('This is some NEW bogus payload');
    });
    test('it should have ignored some keys', () => {
        const serializedState = index_1.localStorage[index_1.LOCAL_STORAGE_KEY];
        const deserializedState = index_1.deserialize(serializedState);
        expect(deserializedState).not.toHaveProperty('ignored');
    });
    test('rehydration should restore state and merge with initial state', () => {
        const rehydrated = percyst.rehydrate({ initial: 'initial key/value' });
        expect(rehydrated).toHaveProperty('todo');
        expect(rehydrated).toHaveProperty('initial');
    });
});
describe('Redux store with encryption', () => {
    const percyst = new index_1.Percyst({
        encryptSecret: ENCRYPT_SECRET
    });
    // initialize mockstore with pseudo reducer
    beforeAll(() => {
        index_1.localStorage.clear();
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
        expect(index_1.localStorage).toHaveProperty(index_1.LOCAL_STORAGE_KEY);
        const encryptedState = index_1.localStorage[index_1.LOCAL_STORAGE_KEY];
        const deserializedState = index_1.decrypt(encryptedState, ENCRYPT_SECRET);
        expect(deserializedState).toHaveProperty('todo');
        expect(deserializedState['todo']).toEqual('This is some NEW bogus payload');
    });
    test('rehydration should restore encrypted state and merge with initial state', () => {
        const rehydrated = percyst.rehydrate({ initial: 'initial key/value' });
        expect(rehydrated).toHaveProperty('todo');
        expect(rehydrated).toHaveProperty('initial');
    });
    test('rehydration with encryption should work on null state', () => {
        index_1.localStorage.clear();
        const rehydrated = percyst.rehydrate({ initial: 'initial key/value' });
        expect(rehydrated).toHaveProperty('initial');
    });
});
//# sourceMappingURL=index.spec.js.map