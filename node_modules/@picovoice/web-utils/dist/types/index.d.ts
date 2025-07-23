import { PvModel } from './types';
import { aligned_alloc_type, pv_free_type, buildWasm } from './wasm';
import { arrayBufferToBase64AtIndex, arrayBufferToStringAtIndex, base64ToUint8Array, fetchWithTimeout, fromBase64, fromPublicDirectory, isAccessKeyValid, loadModel, stringHeaderToObject, open } from './utils';
import { PvFile } from './pv_file';
import { PvError } from './pv_error';
import { PvFileMem } from './pv_file_mem';
import { PvFileIDB, getDB } from './pv_file_idb';
declare const dbConfig: {
    DB_NAME: string;
    DB_VERSION: number;
    PV_FILE_STORE: string;
};
export { aligned_alloc_type, pv_free_type, buildWasm, arrayBufferToBase64AtIndex, arrayBufferToStringAtIndex, base64ToUint8Array, fetchWithTimeout, isAccessKeyValid, stringHeaderToObject, fromBase64, fromPublicDirectory, loadModel, open, dbConfig, getDB, PvFile, PvFileIDB, PvFileMem, PvError, PvModel, };
//# sourceMappingURL=index.d.ts.map