import { MutationsMixin } from '../Mutations.mixin';
import { BaseGenuineTransaction } from '../../transactions/genuine';

jest.mock('@services/NetworkService');

describe('Mutations Mixin', () => {
    const Mixed = MutationsMixin(BaseGenuineTransaction);

    // TODO: add more test for the getter's
    // it('Should return right values', () => {
    //
    // });

    it('Should return the ctid from tx if present', () => {
        const instance = new Mixed({ ctid: 'C000002D00005359' } as any, {} as any);
        expect(instance.CTID).toBe('C000002D00005359');
    });

    it('Should be able to generate the right CTID', () => {
        const instance = new Mixed({ ledger_index: 57913674 } as any, { TransactionIndex: 4 } as any);
        expect(instance.CTID).toBe('C373B14A00040000');
    });
});
