import { LedgerIndex } from '../common';

import type { Request } from '.';

export interface BaseRequest {
    [x: string]: unknown;
    id?: string;
    command: string;
    api_version?: number;
}

export interface LookupByLedgerRequest {
    ledger_hash?: string;
    ledger_index?: LedgerIndex;
}

export interface ResponseWarning {
    id: number;
    message: string;
    details?: { [key: string]: string };
}

export interface BaseResponse {
    id: string;
    __replyMs: number;
    __command: any;
    __networkId: number;
    inLedger: any;
}

export interface ErrorResponse extends BaseResponse {
    status: 'error';
    type: 'response' | string;
    error: string;
    error_code?: string;
    error_message?: string;
    error_exception?: string;
    request: Request;
}
