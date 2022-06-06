/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import DepositPreauth from '../depositPreauth';

import depositPreauthTemplate from './templates/DepositPreauthTx.json';

describe('DepositPreauth tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new DepositPreauth();
        expect(instance.TransactionType).toBe('DepositPreauth');
        expect(instance.Type).toBe('DepositPreauth');
    });

    it('Should return right parsed values', () => {
        // @ts-ignore
        const { tx, meta } = depositPreauthTemplate;
        const instance = new DepositPreauth(tx, meta);

        expect(instance.Authorize).toBe('rEhxGqkqPPSxQ3P25J66ft5TwpzV14k2de');

        expect(instance.Unauthorize).toBe('rEhxGqkqPPSxQ3P25J66ft5TwpzV14k2de');
    });
});
