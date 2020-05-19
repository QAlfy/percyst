export declare const LOCAL_STORAGE_KEY = "___percyst";
export declare const LOCAL_STORAGE_TTL_KEY = "___percyst_ttl";
export declare const localStorage: Storage;
export declare const futureDate: any;
export declare const serialize: any;
export declare const deserialize: any;
export declare const encrypt: any;
export declare const decrypt: any;
export declare type PercystOptions = {
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
export declare class Percyst {
    private options;
    constructor(options?: PercystOptions);
    /**
     * The Percyst middleware to inject with Redux's applyMiddleware.
     *
     * @param  {any} action
     * @returns void
     */
    middleware: (store: any) => (next: any) => (action: any) => void;
    /**
     * Use this method along with a default desired state in order
     * to restore the state persisted by Percyst.
     *
     * To be used with Redux's createStore (preloadedState).
     *
     * @param  {} initialState={}
     * @returns any
     */
    rehydrate(initialState?: any): any;
}
