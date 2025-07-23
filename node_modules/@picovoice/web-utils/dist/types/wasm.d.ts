import { PvError } from './pv_error';
export type aligned_alloc_type = (alignment: number, size: number) => Promise<number>;
export type pv_free_type = (ptr: number) => Promise<void>;
/**
 * Imports and Exports functions required for WASM.
 *
 * @param memory Initialized WebAssembly memory object.
 * @param wasm The wasm file in base64 string or stream to public path (i.e. fetch("file.wasm")) to initialize.
 * @param pvError The PvError object to store error details.
 * @returns An object containing the exported functions from WASM.
 */
export declare function buildWasm(memory: WebAssembly.Memory, wasm: string | Promise<Response>, pvError?: PvError): Promise<any>;
//# sourceMappingURL=wasm.d.ts.map