import { Payload } from '@common/libs/payload';
import { AccountModel } from '@store/models';
import { PseudoTransactions, Transactions } from '@common/libs/ledger/transactions/types';
import { SignMixinType } from '@common/libs/ledger/mixin/types';

export interface TemplateProps {
    source: AccountModel;
    payload: Payload;
    transaction: (Transactions | PseudoTransactions) & SignMixinType;
    setLoading: (loading: boolean) => void;
    setReady: (ready: boolean) => void;
    forceRender: () => void;
}
