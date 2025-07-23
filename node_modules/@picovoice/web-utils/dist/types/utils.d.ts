import { PvFile } from './pv_file';
import { PvModel } from './types';
/**
 * Convert a null terminated phrase stored inside an array buffer to a string
 *
 * @param arrayBuffer input array buffer
 * @param indexStart the index at which the phrase is stored
 * @return retrieved string
 */
export declare function arrayBufferToStringAtIndex(arrayBuffer: Uint8Array, indexStart: number): string;
/**
 * Decode a base64 string and stored it in a Uint8Array array
 *
 * @param base64String input base64 string
 * @return decoded array
 */
export declare function base64ToUint8Array(base64String: string): Uint8Array;
/**
 * Encode an ArrayBuffer array to base64 string
 *
 * @param arrayBuffer input array
 * @param size size of the phrase to be encoded
 * @param index the index at which the phrase is stored
 * @return base64 string
 */
export declare function arrayBufferToBase64AtIndex(arrayBuffer: ArrayBuffer, size: number, index: number): string;
/**
 * Convert a string header to JS object
 *
 * @param stringHeader input string in json format
 * @return retrieved object
 */
export declare function stringHeaderToObject(stringHeader: string): object;
/**
 * A wrapper to fetch that also supports timeout
 *
 * @param uri the URL of the resource
 * @param options other options related to fetch
 * @param time timeout value
 * @return received response
 */
export declare function fetchWithTimeout(uri: string, options?: {}, time?: number): Promise<Response>;
/**
 * Checking whether the given AccessKey is valid
 *
 * @return true if the AccessKey is valid, false if not
 */
export declare function isAccessKeyValid(accessKey: string): boolean;
/**
 * Opens the file given the path and mode.
 * @returns PvFile instance.
 */
export declare function open(path: string, mode: string): Promise<PvFile>;
/**
 * PvFile helper.
 * Write modelBase64 to modelPath depending on options forceWrite and version.
 */
export declare function fromBase64(modelPath: string, modelBase64: string, forceWrite: boolean, version: number): Promise<void>;
/**
 * PvFile helper.
 * Write publicPath's model to modelPath depending on options forceWrite and version.
 */
export declare function fromPublicDirectory(modelPath: string, publicPath: string, forceWrite: boolean, version: number, numFetchReties: number): Promise<void>;
/**
 * Takes a Picovoice model file and either decodes it from base64 or fetches
 * it from the public directory. Saves the result to storage on version increase or
 * if forceWrite is enabled.
 */
export declare function loadModel(model: PvModel): Promise<string>;
//# sourceMappingURL=utils.d.ts.map