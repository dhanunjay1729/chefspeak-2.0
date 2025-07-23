import { PvFileMeta } from '../types';
import { PvFile } from "./pv_file";
/**
 * Indexed DB configurations
 */
export declare const DB_NAME = "pv_db";
export declare const PV_FILE_STORE = "pv_file";
export declare const DB_VERSION = 3;
/**
 * Helper to get IndexedDB.
 */
export declare function getDB(): Promise<IDBDatabase>;
/**
 * PvFile Class
 * This class mocks the file system using IndexedDB.
 * IndexedDB is REQUIRED.
 */
export declare class PvFileIDB extends PvFile {
    private readonly _pageSize;
    private readonly _db;
    private readonly _mode;
    private _pagePtr;
    private _pageOffset;
    /**
     * Constructor of PvFile instance.
     * @param path The path of a file.
     * @param meta The metadata of the file.
     * @param db The db instance currently related to the opened file.
     * @param mode The mode - either readonly or readwrite.
     */
    protected constructor(path: string, meta: PvFileMeta, db: IDBDatabase, mode: IDBTransactionMode);
    /**
     * Opens a file and return an instance of PvFile. A file can be opened in readonly or readwrite mode
     * which follows IndexedDB standard of reading and writing values to the db.
     * The file is stored as an Uint8Array separated by pages.
     * NOTE: The key exactly matching the path expects a value of type PvFileMeta.
     * @param path The path of the file to open stored in IndexedDB.
     * @param mode A string, if it contains 'r' in the string, it will open the file in readonly mode, else it
     * will open in readwrite mode.
     * @returns Promise<PvFile> An instance of PvFile.
     * @throws Error if IndexedDB is not supported.
     */
    static open(path: string, mode: string): Promise<PvFileIDB>;
    /**
     * Closes the db connection. Any other instance function call will not work once
     * the db is closed.
     */
    close(): Promise<void>;
    /**
     * Reads a total of 'count' elements, each with a size of 'size' bytes from the current position in the stream.
     * Moves the stream by the amount of elements read.
     * If the last few bytes is smaller than 'size' it will not read (similar to fread) the bytes.
     * @param size The element size.
     * @param count The number of elements to read.
     * @returns Promise<Uint8Array> A Uint8Array with the elements copied to it.
     * @throws Error if file doesn't exist or if EOF.
     */
    read(size: number, count: number): Promise<Uint8Array>;
    /**
     * Writes an Uint8Array to IndexedDB seperated by pages.
     * @param content The bytes to save.
     * @param version Version of the file.
     */
    write(content: Uint8Array, version?: number): Promise<void>;
    /**
     * Moves the current position in the stream by 'offset' elements at 'whence' position.
     * @param offset The number of bytes to move.
     * @param whence One of:
     *  - 0: moves position from beginning of file.
     *  - 1: moves position from current position in the stream.
     *  - 2: moves position from the last element of the file.
     * @throws Error if file doesn't exist or if EOF.
     */
    seek(offset: number, whence: number): void;
    /**
     * Returns the number of bytes from the beginning of the file.
     */
    tell(): number;
    /**
     * Removes a file and any related pages given the path.
     */
    remove(): Promise<void>;
    /**
     * Checks if the following path exists.
     */
    exists(): boolean;
    /**
     * Checks if the current stream is EOF.
     */
    protected get _isEOF(): boolean;
    /**
     * Creates an index which as a key to save page data to IndexedDB.
     * This formats the file into 0000, 0001, 0002 ...
     * @param page The page number to format.
     */
    private static createPage;
    /**
     * Gets a objectStore instance from the PvFile instance.
     */
    private get _store();
}
//# sourceMappingURL=pv_file_idb.d.ts.map