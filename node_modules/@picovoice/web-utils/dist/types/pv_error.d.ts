type PvErrorType = {
    key: string;
    message: string;
};
export declare class PvError {
    private _maxNumErrors;
    private _errors;
    private _lastError;
    /**
     * Store an error with a key and message.
     */
    addError(key: string, error?: string | Error): void;
    /**
     * Get all recent error messages. Cleans up error list.
     */
    getErrors(): PvErrorType[];
    /**
     * Get errors formatted into a string.
     */
    getErrorString(): string;
    /**
     * Returns the last error message added to the object.
     */
    getLastError(): Error;
    /**
     * Sets the maximum number of errors it can store.
     */
    setMaxErrorNum(num: number): void;
}
export {};
//# sourceMappingURL=pv_error.d.ts.map