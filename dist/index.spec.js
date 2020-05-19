"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const date = __importStar(require("mockdate"));
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
    test('rehydration should restore encrypted state and merge with \
  initial state', () => {
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
describe('Redux store with TTL', () => {
    const ttl = 2000; // 2 seconds
    const percyst = new index_1.Percyst({ ttl });
    // initialize mockstore with pseudo reducer
    beforeAll(() => {
        date.reset();
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
    test('stored state expires if ttl is exceeded', () => __awaiter(void 0, void 0, void 0, function* () {
        const firstHitDate = new Date(Number(index_1.localStorage[index_1.LOCAL_STORAGE_TTL_KEY]));
        // travel to the future
        date.set((new Date()).setMilliseconds(ttl * 1.5));
        const rehydrated = percyst.rehydrate();
        expect(rehydrated).toEqual({});
    }));
});
//# sourceMappingURL=index.spec.js.map