/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */
import ClaimReward from '../claimReward';

jest.mock('@services/NetworkService');

describe('ClaimReward tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new ClaimReward();
        expect(instance.TransactionType).toBe('ClaimReward');
        expect(instance.Type).toBe('ClaimReward');
    });
});
