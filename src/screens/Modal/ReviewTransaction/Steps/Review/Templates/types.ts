import { Payload } from '@common/libs/payload';
import { AccountModel } from '@store/models';
import { PseudoTransactions, Transactions } from '@common/libs/ledger/transactions/types';

export interface TemplateProps {
    source: AccountModel;
    payload: Payload;
    transaction: Transactions | PseudoTransactions;
    setLoading: (loading: boolean) => void;
    setReady: (ready: boolean) => void;
    forceRender: () => void;
}
