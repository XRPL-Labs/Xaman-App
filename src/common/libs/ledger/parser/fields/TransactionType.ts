import { PseudoTransactionTypes, TransactionTypes } from '@common/libs/ledger/types/enums';

/* Field ==================================================================== */
export const TransactionType = {
    getter: (self: any, field: string) => {
        return ():
            | TransactionTypes
            | Exclude<
                  PseudoTransactionTypes,
                  PseudoTransactionTypes.SignIn | PseudoTransactionTypes.PaymentChannelAuthorize
              >
            | string => {
            return self[field];
        };
    },
    setter: (self: any, field: string) => {
        return (value: any): void => {
            self[field] = value;
        };
    },
};
