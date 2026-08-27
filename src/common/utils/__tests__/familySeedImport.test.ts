import { derive } from 'xrpl-accountlib';

import {
    deriveFamilySeedAccount,
    isFamilySeedCurvePickerEligible,
    pickFamilySeedCurve,
} from '../familySeedImport';

const SAMPLE = 'snYHBZDJ51PPSuzWYVhEh1kb9zvEU';
const SECP_ADDRESS = 'rJ9uJ32u3Y46RenZrfvdYWjVf5ReKwf5Wr';
const ED_ADDRESS = 'raKHBXGhVR5nXKtSCeyGqBjswbboUa17tC';

describe('familySeedImport', () => {
    describe('isFamilySeedCurvePickerEligible', () => {
        it('is true for a complete secp-encoded family seed', () => {
            expect(isFamilySeedCurvePickerEligible(SAMPLE)).toBe(true);
        });

        it('is false for sEd seeds, hex keys, short input, and empty', () => {
            expect(isFamilySeedCurvePickerEligible('sEdTVeGzHzhVVu7WHzxM8iNph5zUyRo')).toBe(false);
            expect(isFamilySeedCurvePickerEligible(`ED${'aa'.repeat(32)}`)).toBe(false);
            expect(isFamilySeedCurvePickerEligible('snotcomplete')).toBe(false);
            expect(isFamilySeedCurvePickerEligible(undefined)).toBe(false);
            expect(isFamilySeedCurvePickerEligible('')).toBe(false);
        });
    });

    describe('deriveFamilySeedAccount', () => {
        it('defaults to secp256k1 and does not pass algorithm', () => {
            const spy = jest.spyOn(derive, 'familySeed');
            const account = deriveFamilySeedAccount(SAMPLE);

            expect(account.address).toBe(SECP_ADDRESS);
            expect(account.keypair.publicKey?.startsWith('ED')).toBe(false);
            expect(spy).toHaveBeenCalledWith(SAMPLE);
            spy.mockRestore();
        });

        it('explicit secp256k1 matches default and still omits algorithm', () => {
            const spy = jest.spyOn(derive, 'familySeed');
            const account = deriveFamilySeedAccount(SAMPLE, 'secp256k1');

            expect(account.address).toBe(SECP_ADDRESS);
            expect(spy).toHaveBeenCalledWith(SAMPLE);
            spy.mockRestore();
        });

        it('ed25519 derives a different account', () => {
            const account = deriveFamilySeedAccount(SAMPLE, 'ed25519');

            expect(account.address).toBe(ED_ADDRESS);
            expect(account.address).not.toBe(SECP_ADDRESS);
            expect(account.keypair.publicKey?.startsWith('ED')).toBe(true);
        });
    });

    describe('pickFamilySeedCurve', () => {
        it('falls back to secp when neither account is activated', async () => {
            const getAccountInfo = jest.fn().mockResolvedValue({ error: 'actNotFound' });
            const picked = await pickFamilySeedCurve({ secret: SAMPLE, getAccountInfo });

            expect(picked).toEqual({
                status: 'ready',
                algorithm: 'secp256k1',
                address: SECP_ADDRESS,
            });
            expect(getAccountInfo).toHaveBeenCalledWith(SECP_ADDRESS);
            expect(getAccountInfo).toHaveBeenCalledWith(ED_ADDRESS);
        });

        it('asks to confirm ed25519 when only that account is activated', async () => {
            const getAccountInfo = jest.fn(async (address: string) => {
                if (address === ED_ADDRESS) {
                    return { account_data: { Account: ED_ADDRESS, Balance: '1000000' } };
                }
                return { error: 'actNotFound' };
            });

            await expect(pickFamilySeedCurve({ secret: SAMPLE, getAccountInfo })).resolves.toEqual({
                status: 'ready',
                algorithm: 'ed25519',
                address: ED_ADDRESS,
                confirm: {
                    algorithm: 'ed25519',
                    address: ED_ADDRESS,
                    secpAddress: SECP_ADDRESS,
                },
            });
        });

        it('keeps secp when only secp is activated', async () => {
            const getAccountInfo = jest.fn(async (address: string) => {
                if (address === SECP_ADDRESS) {
                    return { account_data: { Account: SECP_ADDRESS, Balance: '1000000' } };
                }
                return { error: 'actNotFound' };
            });

            await expect(pickFamilySeedCurve({ secret: SAMPLE, getAccountInfo })).resolves.toEqual({
                status: 'ready',
                algorithm: 'secp256k1',
                address: SECP_ADDRESS,
            });
        });

        it('keeps secp when both accounts are activated', async () => {
            const getAccountInfo = jest.fn(async (address: string) => {
                return { account_data: { Account: address, Balance: '1000000' } };
            });

            await expect(pickFamilySeedCurve({ secret: SAMPLE, getAccountInfo })).resolves.toEqual({
                status: 'ready',
                algorithm: 'secp256k1',
                address: SECP_ADDRESS,
            });
        });

        it('is inconclusive when a lookup throws instead of actNotFound', async () => {
            const getAccountInfo = jest.fn().mockRejectedValue(new Error('offline'));

            await expect(pickFamilySeedCurve({ secret: SAMPLE, getAccountInfo })).resolves.toEqual({
                status: 'inconclusive',
                secp: { algorithm: 'secp256k1', address: SECP_ADDRESS },
                ed: { algorithm: 'ed25519', address: ED_ADDRESS },
            });
        });

        it('is inconclusive when only the ed25519 lookup fails', async () => {
            const getAccountInfo = jest.fn(async (address: string) => {
                if (address === ED_ADDRESS) {
                    throw new Error('timeout');
                }
                return { error: 'actNotFound' };
            });

            await expect(pickFamilySeedCurve({ secret: SAMPLE, getAccountInfo })).resolves.toEqual({
                status: 'inconclusive',
                secp: { algorithm: 'secp256k1', address: SECP_ADDRESS },
                ed: { algorithm: 'ed25519', address: ED_ADDRESS },
            });
        });
    });
});
