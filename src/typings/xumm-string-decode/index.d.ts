/*  eslint-disable  */

// this will extend the types
import * as xumm from 'xumm-string-decode';

declare module 'xumm-string-decode' {
    export interface XrplDestination {
        to: string;
        tag?: number;
        invoiceid?: string;
        amount?: string;
        currency?: string;
        issuer?: string;
    }
}
