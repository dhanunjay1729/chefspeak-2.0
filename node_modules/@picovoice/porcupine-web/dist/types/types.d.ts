import { BuiltInKeyword } from './built_in_keywords';
import { PvModel } from "@picovoice/web-utils";
import { PorcupineError } from "./porcupine_errors";
export declare enum PvStatus {
    SUCCESS = 10000,
    OUT_OF_MEMORY = 10001,
    IO_ERROR = 10002,
    INVALID_ARGUMENT = 10003,
    STOP_ITERATION = 10004,
    KEY_ERROR = 10005,
    INVALID_STATE = 10006,
    RUNTIME_ERROR = 10007,
    ACTIVATION_ERROR = 10008,
    ACTIVATION_LIMIT_REACHED = 10009,
    ACTIVATION_THROTTLED = 10010,
    ACTIVATION_REFUSED = 10011
}
export type PorcupineOptions = {
    /** @defaultValue '(error) => {}' */
    processErrorCallback?: (error: PorcupineError) => void;
};
export type PorcupineKeywordCustom = PvModel & {
    /** An arbitrary label that you want Porcupine to report when the detection occurs */
    label: string;
    /** Value in range [0,1] that trades off miss rate for false alarm */
    /** @defaultValue 0.5 */
    sensitivity?: number;
};
export type PorcupineKeywordBuiltin = {
    /** Name of a builtin keyword */
    builtin: BuiltInKeyword;
    /** Value in range [0,1] that trades off miss rate for false alarm */
    /** @defaultValue 0.5 */
    sensitivity?: number;
};
export type PorcupineKeyword = PorcupineKeywordCustom | PorcupineKeywordBuiltin;
export type PorcupineModel = PvModel;
export type PorcupineDetection = {
    /** The index of the detected keyword */
    index: number;
    /** The label of the detected keyword */
    label: string;
};
export type DetectionCallback = (detection: PorcupineDetection) => void;
export type PorcupineWorkerInitRequest = {
    command: 'init';
    accessKey: string;
    modelPath: string;
    keywordLabels: Array<string>;
    keywordPaths: Array<string>;
    sensitivities: Float32Array;
    wasm: string;
    wasmSimd: string;
    sdk: string;
    options: PorcupineOptions;
};
export type PorcupineWorkerProcessRequest = {
    command: 'process';
    inputFrame: Int16Array;
};
export type PorcupineWorkerReleaseRequest = {
    command: 'release';
};
export type PorcupineWorkerRequest = PorcupineWorkerInitRequest | PorcupineWorkerProcessRequest | PorcupineWorkerReleaseRequest;
export type PorcupineWorkerFailureResponse = {
    command: 'failed' | 'error';
    status: PvStatus;
    shortMessage: string;
    messageStack: string[];
};
export type PorcupineWorkerInitResponse = PorcupineWorkerFailureResponse | {
    command: 'ok';
    frameLength: number;
    sampleRate: number;
    version: string;
};
export type PorcupineWorkerProcessResponse = PorcupineWorkerFailureResponse | {
    command: 'ok';
    porcupineDetection: PorcupineDetection;
};
export type PorcupineWorkerReleaseResponse = PorcupineWorkerFailureResponse | {
    command: 'ok';
};
export type PorcupineWorkerResponse = PorcupineWorkerInitResponse | PorcupineWorkerProcessResponse | PorcupineWorkerReleaseResponse;
//# sourceMappingURL=types.d.ts.map