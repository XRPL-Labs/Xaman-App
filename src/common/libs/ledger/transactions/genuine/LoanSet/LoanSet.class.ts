import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { Hash256, Amount, AccountID, UInt32, Blob, STObject } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class LoanSet extends BaseGenuineTransaction {
    public static Type = TransactionTypes.LoanSet as const;
    public readonly Type = LoanSet.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        LoanBrokerID: { required: true, type: Hash256 },
        PrincipalRequested: { required: true, type: Amount },
        Counterparty: { type: AccountID },
        CounterpartySignature: { type: STObject },
        Data: { type: Blob },
        PaymentTotal: { type: UInt32 },
        PaymentInterval: { type: UInt32 },
        GracePeriod: { type: UInt32 },
        InterestRate: { type: UInt32 },
        LateInterestRate: { type: UInt32 },
        CloseInterestRate: { type: UInt32 },
        OverpaymentInterestRate: { type: UInt32 },
        LoanOriginationFee: { type: Amount },
        LoanServiceFee: { type: Amount },
        LatePaymentFee: { type: Amount },
        ClosePaymentFee: { type: Amount },
        OverpaymentFee: { type: UInt32 },
    };

    declare LoanBrokerID: FieldReturnType<typeof Hash256>;
    declare PrincipalRequested: FieldReturnType<typeof Amount>;
    declare Counterparty: FieldReturnType<typeof AccountID>;
    declare CounterpartySignature: FieldReturnType<typeof STObject>;
    declare Data: FieldReturnType<typeof Blob>;
    declare PaymentTotal: FieldReturnType<typeof UInt32>;
    declare PaymentInterval: FieldReturnType<typeof UInt32>;
    declare GracePeriod: FieldReturnType<typeof UInt32>;
    declare InterestRate: FieldReturnType<typeof UInt32>;
    declare LateInterestRate: FieldReturnType<typeof UInt32>;
    declare CloseInterestRate: FieldReturnType<typeof UInt32>;
    declare OverpaymentInterestRate: FieldReturnType<typeof UInt32>;
    declare LoanOriginationFee: FieldReturnType<typeof Amount>;
    declare LoanServiceFee: FieldReturnType<typeof Amount>;
    declare LatePaymentFee: FieldReturnType<typeof Amount>;
    declare ClosePaymentFee: FieldReturnType<typeof Amount>;
    declare OverpaymentFee: FieldReturnType<typeof UInt32>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = LoanSet.Type;
    }
}

/* Export ==================================================================== */
export default LoanSet;
