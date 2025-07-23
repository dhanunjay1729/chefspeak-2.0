import { PvFileMeta } from '../types';
/**
 * BasePvFile Class
 * This class mocks the file system using in-memory storage.
 */
export declare abstract class PvFile {
    protected static _filePtrs: Map<number, PvFile>;
    protected _path: string;
    protected _meta: PvFileMeta | undefined;
    /**
     * Getter for file's meta information.
     */
    get meta(): PvFileMeta | undefined;
    abstract close(): Promise<void> | void;
    abstract read(size: number, count: number): Promise<Uint8Array> | Uint8Array;
    abstract write(content: Uint8Array, version?: number): Promise<void> | void;
    abstract seek(offset: number, whence: number): void;
    abstract tell(): number;
    abstract remove(): Promise<void> | void;
    abstract exists(): boolean;
    /**
     * Get the file pointer from the _filePtrs map.
     * @param ptr The pointer to BasePvFile instance to get from the map.
     * @returns BasePvFile returns the current file instance related to ptr.
     */
    static getPtr(ptr: number): PvFile;
    /**
     * Saves the BasePvFile instance to the map with an associated ptr.
     * @param ptr The file pointer to save as the key.
     * @param instance The BasePvFile instance to save as the value.
     */
    static setPtr(ptr: number, instance: PvFile): void;
    /**
     * Removes the ptr from the _filePtrs map.
     * @param ptr The file pointer to remove.
     */
    static removePtr(ptr: number): void;
    /**
     * Checks if the current stream is EOF.
     */
    protected abstract get _isEOF(): boolean;
}
//# sourceMappingURL=pv_file.d.ts.map