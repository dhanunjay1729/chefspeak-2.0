import { PvError } from "@picovoice/web-utils";
import { PvStatus } from "./types";
declare class PorcupineError extends Error {
    private readonly _status;
    private readonly _shortMessage;
    private readonly _messageStack;
    constructor(status: PvStatus, message: string, messageStack?: string[], pvError?: PvError | null);
    get status(): PvStatus;
    get shortMessage(): string;
    get messageStack(): string[];
    private static errorToString;
}
declare class PorcupineOutOfMemoryError extends PorcupineError {
    constructor(message: string, messageStack?: string[], pvError?: PvError | null);
}
declare class PorcupineIOError extends PorcupineError {
    constructor(message: string, messageStack?: string[], pvError?: PvError | null);
}
declare class PorcupineInvalidArgumentError extends PorcupineError {
    constructor(message: string, messageStack?: string[], pvError?: PvError | null);
}
declare class PorcupineStopIterationError extends PorcupineError {
    constructor(message: string, messageStack?: string[], pvError?: PvError | null);
}
declare class PorcupineKeyError extends PorcupineError {
    constructor(message: string, messageStack?: string[], pvError?: PvError | null);
}
declare class PorcupineInvalidStateError extends PorcupineError {
    constructor(message: string, messageStack?: string[], pvError?: PvError | null);
}
declare class PorcupineRuntimeError extends PorcupineError {
    constructor(message: string, messageStack?: string[], pvError?: PvError | null);
}
declare class PorcupineActivationError extends PorcupineError {
    constructor(message: string, messageStack?: string[], pvError?: PvError | null);
}
declare class PorcupineActivationLimitReachedError extends PorcupineError {
    constructor(message: string, messageStack?: string[], pvError?: PvError | null);
}
declare class PorcupineActivationThrottledError extends PorcupineError {
    constructor(message: string, messageStack?: string[], pvError?: PvError | null);
}
declare class PorcupineActivationRefusedError extends PorcupineError {
    constructor(message: string, messageStack?: string[], pvError?: PvError | null);
}
export { PorcupineError, PorcupineOutOfMemoryError, PorcupineIOError, PorcupineInvalidArgumentError, PorcupineStopIterationError, PorcupineKeyError, PorcupineInvalidStateError, PorcupineRuntimeError, PorcupineActivationError, PorcupineActivationLimitReachedError, PorcupineActivationThrottledError, PorcupineActivationRefusedError, };
export declare function pvStatusToException(pvStatus: PvStatus, errorMessage: string, messageStack?: string[], pvError?: PvError | null): PorcupineError;
//# sourceMappingURL=porcupine_errors.d.ts.map