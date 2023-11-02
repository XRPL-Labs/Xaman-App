/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import { NFTokenCreateOffer } from '@common/libs/ledger/transactions';

jest.mock('@services/NetworkService');

describe('NFTokenCreateOffer tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new NFTokenCreateOffer();
        expect(instance.TransactionType).toBe('NFTokenCreateOffer');
        expect(instance.Type).toBe('NFTokenCreateOffer');
    });
});
