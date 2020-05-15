declare module 'ripple-binary-codec' {
    export function decode(param: String): object;

    export function encode(param: object): string;

    export function encodeForSigning(param: object): string;

    export function encodeForSigningClaim(param: object): string;

    export function encodeQuality(param: string): string;
}
