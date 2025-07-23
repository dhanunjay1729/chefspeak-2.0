import { PvFile } from './pv_file';
import { PvFileMeta } from '../types';
/**
 * PvFileMem Class
 * This class mocks the file system using in-memory storage.
 */
export declare class PvFileMem extends PvFile {
    private _pos;
    private _worker;
    private readonly _mode;
    protected constructor(path: string, worker: SharedWorker, meta?: PvFileMeta, db?: IDBDatabase, mode?: IDBTransactionMode);
    static open(path: string, mode: string): Promise<PvFileMem>;
    close(): Promise<void>;
    read(size: number, count: number): Promise<Uint8Array>;
    write(content: Uint8Array, version?: number): Promise<void>;
    seek(offset: number, whence: number): void;
    tell(): number;
    remove(): Promise<void>;
    exists(): boolean;
    protected get _isEOF(): boolean;
}
//# sourceMappingURL=pv_file_mem.d.ts.map