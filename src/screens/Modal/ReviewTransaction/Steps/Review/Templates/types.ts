import { Payload } from '@common/libs/payload';
import { AccountSchema } from '@store/schemas/latest';
import { PseudoTransactions, Transactions } from '@common/libs/ledger/transactions/types';

export interface TemplateProps {
    source: AccountSchema;
    payload: Payload;
    transaction: Transactions | PseudoTransactions;
    setLoading: (loading: boolean) => void;
    setReady: (ready: boolean) => void;
    forceRender: () => void;
}
