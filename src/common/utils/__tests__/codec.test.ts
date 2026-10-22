import { libraries } from 'xrpl-accountlib';
import { EncodeNFTokenID, DecodeNFTokenID, NormalizeDestination } from '../codec';

describe('Utils.codec', () => {
    describe('DecodeNFTokenID', () => {
        it('should decode NFTokenID correctly', () => {
            const nfTokenID = '000813883EBCBE82C32E1CA28616DBDD2E40873D446B0EC505C73BA9047ED3FE';

            const decoded = DecodeNFTokenID(nfTokenID);

            expect(decoded.NFTokenID).toBe(nfTokenID);
            expect(decoded.Flags).toBe(8);
            expect(decoded.TransferFee).toBe(5000);
            expect(decoded.Issuer).toBe('ra5jrnrq9BxsvzGeJY5XS9inftcJWMdJUx');
            expect(decoded.Taxon).toBe(48);
            expect(decoded.Sequence).toBe(75420670);
        });

        it('should throw error for invalid NFTokenID length', () => {
            const nfTokenID = 'invalidTokenID'; // NFTokenID with invalid length
            expect(() => DecodeNFTokenID(nfTokenID)).toThrow('Invalid nfTokenID, should be 64 bytes hex');
        });
    });

    describe('EncodeNFTokenID', () => {
        it('should encode NFTokenID correctly', () => {
            const account = 'ra5jrnrq9BxsvzGeJY5XS9inftcJWMdJUx';
            const tokenSequence = 75420670;
            const flags = 8;
            const transferFee = 5000;
            const tokenTaxon = 48;

            const encoded = EncodeNFTokenID(account, tokenSequence, flags, transferFee, tokenTaxon);

            const expectedEncoded = '000813883EBCBE82C32E1CA28616DBDD2E40873D446B0EC505C73BA9047ED3FE';
            expect(encoded).toBe(expectedEncoded);
        });
    });
});

describe('NormalizeDestination X-address tags', () => {
    it.each([false, 0, 123, 4294967295])('preserves embedded tag %p', (tag) => {
        const address = 'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY';
        const to = libraries.rippleAddressCodec.classicAddressToXAddress(address, tag, false);
        expect(NormalizeDestination({ to }).tag).toBe(tag === false ? undefined : tag);
    });
});
