import { PvFile, PvFileMeta } from "./pv_file";
/**
 * PvFileMem Class
 * This class mocks the file system using in-memory storage.
 */
export declare class PvFileMem extends PvFile {
    private static _memFiles;
    private _pos;
    private readonly _mode;
    protected constructor(path: string, meta?: PvFileMeta, db?: IDBDatabase, mode?: IDBTransactionMode);
    static open(path: string, mode: string): PvFileMem;
    close(): void;
    read(size: number, count: number): Uint8Array;
    write(content: Uint8Array, version?: number): void;
    seek(offset: number, whence: number): void;
    tell(): number;
    remove(): Promise<void>;
    exists(): boolean;
    protected get _isEOF(): boolean;
    private get _file();
    private set _file(value);
}
//# sourceMappingURL=pv_file_mem.d.ts.map