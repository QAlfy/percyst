export declare const LOCAL_STORAGE_KEY = "___percyst";
export declare const localStorage: Storage;
export declare const serialize: any;
export declare const deserialize: any;
export declare const encrypt: any;
export declare const decrypt: any;
export declare type PercystOptions = {
    ignore?: Array<string>;
    /**
    When defined, Percyst will encrypt the state using this option
    as the encryption key.
    */
    encryptSecret?: string;
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
