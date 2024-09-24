/* eslint-disable max-len */
/* eslint-disable quotes */
import { GetWalletPublicKey, GetWalletDerivedPublicKey, GetPreferCurve, GetSignOptions } from '../tangem';

import cards from './fixtures/tangem.cards.json';

describe('Utils.Tangem', () => {
    describe('GetWalletPublicKey', () => {
        it('should return right wallet public key', () => {
            // @ts-ignore
            expect(GetWalletPublicKey(cards.multiCurrency.ios)).toEqual(
                '0326AC2CCC0D1999DD12104E0A99433EB45C8F51652354F1B52637C2A23C188E2F',
            );
            // @ts-ignore
            expect(GetWalletPublicKey(cards.multiCurrency.android)).toEqual(
                '0326AC2CCC0D1999DD12104E0A99433EB45C8F51652354F1B52637C2A23C188E2F',
            );
            // @ts-ignore
            expect(GetWalletPublicKey(cards.normalSecp.android)).toEqual(
                '045F608652134052BB7D78991FCC6CFC8D50E54AAF336D953999B6326F6E33889D799B03DB1C0AEC9DCA4AEFE2F60C959CF2F4EB62B281CA91C909E2EFC4C62C9A',
            );
            // @ts-ignore
            expect(GetWalletPublicKey(cards.normalSecp.ios)).toEqual(
                '045F608652134052BB7D78991FCC6CFC8D50E54AAF336D953999B6326F6E33889D799B03DB1C0AEC9DCA4AEFE2F60C959CF2F4EB62B281CA91C909E2EFC4C62C9A',
            );
            // @ts-ignore
            expect(GetWalletPublicKey(cards.normalED.android)).toEqual(
                '8E834BE3CD95FF38494B7C32A1394DDF3EC8278F83760B38FD9998FBB2978A96',
            );
            // @ts-ignore
            expect(GetWalletPublicKey(cards.normalED.ios)).toEqual(
                '8E834BE3CD95FF38494B7C32A1394DDF3EC8278F83760B38FD9998FBB2978A96',
            );
        });
    });

    describe('GetWalletDerivedPublicKey', () => {
        it('should return right derived public key', () => {
            // @ts-ignore
            expect(GetWalletDerivedPublicKey(cards.multiCurrency.ios)).toEqual(
                '03C105B85FEEA5DFA880CDD0973A40A48DFD71CFB1304F9666B33CDF3A0895ADE6',
            );
            // @ts-ignore
            expect(GetWalletDerivedPublicKey(cards.multiCurrency.android)).toEqual(
                '03C105B85FEEA5DFA880CDD0973A40A48DFD71CFB1304F9666B33CDF3A0895ADE6',
            );
            // @ts-ignore
            expect(GetWalletDerivedPublicKey(cards.normalSecp.android)).toEqual(
                '025F608652134052BB7D78991FCC6CFC8D50E54AAF336D953999B6326F6E33889D',
            );
            // @ts-ignore
            expect(GetWalletDerivedPublicKey(cards.normalSecp.ios)).toEqual(
                '025F608652134052BB7D78991FCC6CFC8D50E54AAF336D953999B6326F6E33889D',
            );
            // @ts-ignore
            expect(GetWalletDerivedPublicKey(cards.normalED.ios)).toEqual(
                'ED8E834BE3CD95FF38494B7C32A1394DDF3EC8278F83760B38FD9998FBB2978A96',
            );
            // @ts-ignore
            expect(GetWalletDerivedPublicKey(cards.normalED.android)).toEqual(
                'ED8E834BE3CD95FF38494B7C32A1394DDF3EC8278F83760B38FD9998FBB2978A96',
            );
        });
    });

    describe('GetPreferCurve', () => {
        it('should return right curve base on card settings', () => {
            // @ts-ignore
            expect(GetPreferCurve(cards.multiCurrency.ios.supportedCurves)).toEqual('secp256k1');
            // @ts-ignore
            expect(GetPreferCurve(cards.multiCurrency.android.supportedCurves)).toEqual('secp256k1');
            // @ts-ignore
            expect(GetPreferCurve(cards.normalSecp.ios.supportedCurves)).toEqual('secp256k1');
            // @ts-ignore
            expect(GetPreferCurve(cards.normalSecp.android.supportedCurves)).toEqual('secp256k1');
            // @ts-ignore
            expect(GetPreferCurve(cards.normalED.ios.supportedCurves)).toEqual('ed25519');
            // @ts-ignore
            expect(GetPreferCurve(cards.normalED.android.supportedCurves)).toEqual('ed25519');
        });
    });

    describe('GetSignOptions', () => {
        it('should return right sign options', () => {
            const hash = 'ABCD';
            // @ts-ignore
            expect(GetSignOptions(cards.multiCurrency.ios, hash)).toStrictEqual({
                cardId: 'AC01000000045622',
                derivationPath: "m/44'/144'/0'/0/0",
                hashes: [hash],
                walletPublicKey: '0326AC2CCC0D1999DD12104E0A99433EB45C8F51652354F1B52637C2A23C188E2F',
            });
            // @ts-ignore
            expect(GetSignOptions(cards.multiCurrency.android, hash)).toStrictEqual({
                cardId: 'AC01000000045622',
                derivationPath: "m/44'/144'/0'/0/0",
                hashes: [hash],
                walletPublicKey: '0326AC2CCC0D1999DD12104E0A99433EB45C8F51652354F1B52637C2A23C188E2F',
            });
            // @ts-ignore
            expect(GetSignOptions(cards.normalSecp.ios, hash)).toStrictEqual({
                cardId: 'CB77000000037807',
                hashes: [hash],
                walletPublicKey:
                    '045F608652134052BB7D78991FCC6CFC8D50E54AAF336D953999B6326F6E33889D799B03DB1C0AEC9DCA4AEFE2F60C959CF2F4EB62B281CA91C909E2EFC4C62C9A',
            });
            // @ts-ignore
            expect(GetSignOptions(cards.normalSecp.android, hash)).toStrictEqual({
                cardId: 'CB77000000037807',
                hashes: [hash],
                walletPublicKey:
                    '045F608652134052BB7D78991FCC6CFC8D50E54AAF336D953999B6326F6E33889D799B03DB1C0AEC9DCA4AEFE2F60C959CF2F4EB62B281CA91C909E2EFC4C62C9A',
            });
            // @ts-ignore
            expect(GetSignOptions(cards.normalED.ios, hash)).toStrictEqual({
                cardId: 'CB67999999990078',
                hashes: [hash],
                walletPublicKey: '8E834BE3CD95FF38494B7C32A1394DDF3EC8278F83760B38FD9998FBB2978A96',
            });
            // @ts-ignore
            expect(GetSignOptions(cards.normalED.android, hash)).toStrictEqual({
                cardId: 'CB67999999990078',
                hashes: [hash],
                walletPublicKey: '8E834BE3CD95FF38494B7C32A1394DDF3EC8278F83760B38FD9998FBB2978A96',
            });
        });
    });
});
