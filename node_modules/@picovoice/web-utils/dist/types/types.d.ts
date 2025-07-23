export type PvModel = {
    /** Base64 representation of the file */
    base64?: string;
    /** The file path relative to the public directory */
    publicPath?: string;
    /** Custom path to save the model in storage. */
    customWritePath?: string;
    /** Flag to overwrite the model in storage even if it exists. */
    forceWrite?: boolean;
    /** Version of file in storage. Set to a higher number to update the model file. */
    version?: number;
    /** Number of fetch retry attempts (only applies when `publicPath` is defined) **/
    numFetchRetries?: number;
};
//# sourceMappingURL=types.d.ts.map