import { sign, derive } from 'xrpl-accountlib';

describe('xrpl-accountlib 9.3.1 nativeAsset', () => {
    it('sign() survives a missing codec package-root nativeAsset getter', () => {
        // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
        const codec = require('xrpl-binary-codec-prerelease');
        const original = Object.getOwnPropertyDescriptor(codec, 'nativeAsset');
        Object.defineProperty(codec, 'nativeAsset', {
            configurable: true,
            enumerable: true,
            get: () => undefined,
        });

        try {
            expect(codec.nativeAsset).toBeUndefined();
            const account = derive.passphrase('masterpassphrase');
            const signed = sign(
                {
                    Account: account.address,
                    InvoiceID: 'aa'.repeat(32),
                    NetworkID: 21338,
                },
                account,
            );
            expect(signed.signedTransaction).toBeTruthy();
        } finally {
            if (original) {
                Object.defineProperty(codec, 'nativeAsset', original);
            }
        }
    });
});
