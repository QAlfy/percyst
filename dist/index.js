"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Percyst = exports.decrypt = exports.encrypt = exports.deserialize = exports.serialize = exports.localStorage = exports.LOCAL_STORAGE_KEY = void 0;
const simple_crypto_js_1 = __importDefault(require("simple-crypto-js"));
const ramda_1 = require("ramda");
exports.LOCAL_STORAGE_KEY = '___percyst';
exports.localStorage = window.localStorage;
exports.serialize = ramda_1.curryN(1, JSON.stringify);
exports.deserialize = ramda_1.curryN(1, JSON.parse);
exports.encrypt = ramda_1.converge(ramda_1.call, [
    ramda_1.pipe(ramda_1.nthArg(0), ramda_1.invoker(1, 'encrypt')),
    ramda_1.pipe(ramda_1.nthArg(1), ramda_1.construct(simple_crypto_js_1.default))
]);
exports.decrypt = ramda_1.converge(ramda_1.call, [
    ramda_1.pipe(ramda_1.nthArg(0), ramda_1.invoker(1, 'decrypt')),
    ramda_1.pipe(ramda_1.nthArg(1), ramda_1.construct(simple_crypto_js_1.default))
]);
/**
 * Percyst: an unopinionated Redux store persistor with optional encryption.
 */
class Percyst {
    constructor(options = {}) {
        this.options = options;
        /**
         * The Percyst middleware to inject with Redux's applyMiddleware.
         *
         * @param  {any} action
         * @returns void
         */
        this.middleware = store => next => (action) => {
            const actionResult = next(action);
            const nextState = store.getState();
            const serialized = exports.serialize(ramda_1.omit(ramda_1.defaultTo([])(this.options.ignore), nextState));
            const encrypted = ramda_1.partial(exports.encrypt, [
                serialized, this.options.encryptSecret
            ]);
            exports.localStorage.setItem(exports.LOCAL_STORAGE_KEY, ramda_1.ifElse(ramda_1.is(String), encrypted, ramda_1.always(serialized))(this.options.encryptSecret));
            return actionResult;
        };
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
    rehydrate(initialState = {}) {
        const persisted = exports.localStorage.getItem(exports.LOCAL_STORAGE_KEY);
        const unencrypted = ramda_1.partial(exports.decrypt, [
            persisted, this.options.encryptSecret
        ]);
        const restored = ramda_1.cond([
            [
                // if there is a persisted state and encryption is disabled
                ramda_1.allPass([
                    ramda_1.pipe(ramda_1.prop('p'), ramda_1.is(String)),
                    ramda_1.pipe(ramda_1.prop('k'), ramda_1.isNil)
                ]), ramda_1.compose(exports.deserialize, ramda_1.prop('p'))
            ],
            [
                // if there is a persisted state and encryption is enabled
                ramda_1.allPass([
                    ramda_1.pipe(ramda_1.prop('p'), ramda_1.complement(ramda_1.isNil)),
                    ramda_1.pipe(ramda_1.prop('k'), ramda_1.complement(ramda_1.isNil)),
                ]), unencrypted
            ],
            [
                // if there is no persisted state and encryption is disabled
                ramda_1.allPass([
                    ramda_1.pipe(ramda_1.prop('p'), ramda_1.isNil),
                    ramda_1.pipe(ramda_1.prop('k'), ramda_1.isNil),
                ]), ramda_1.always({})
            ],
            // for any other case
            [ramda_1.T, ramda_1.always({})]
        ])({
            p: persisted,
            k: this.options.encryptSecret
        });
        return ramda_1.mergeAll([initialState, restored]);
    }
}
exports.Percyst = Percyst;
//# sourceMappingURL=index.js.map