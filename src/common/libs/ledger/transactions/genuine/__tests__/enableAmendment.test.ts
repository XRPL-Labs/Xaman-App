/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */
import { EnableAmendment } from '../EnableAmendment';

jest.mock('@services/NetworkService');

describe('EnableAmendment tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new EnableAmendment();
        expect(instance.Type).toBe('EnableAmendment');
    });
});
