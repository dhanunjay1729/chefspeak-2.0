export type BrowserFeatures = {
    _picovoice: boolean;
    AudioWorklet: boolean;
    isSecureContext: boolean;
    mediaDevices: boolean;
    WebAssembly: boolean;
    webKitGetUserMedia: boolean;
    Worker: boolean;
};
/**
 * Check for browser compatibility with Picovoice: WebAssembly, Web Audio API, etc.
 *
 * @return object with compatibility details, with special key '_picovoice' offering a yes/no answer.
 */
export declare function browserCompatibilityCheck(): BrowserFeatures;
//# sourceMappingURL=utils.d.ts.map