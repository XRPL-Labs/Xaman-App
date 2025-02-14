import { type SignableTransaction } from '@common/libs/ledger/transactions/types';
import { type SignedObjectType } from '@common/libs/ledger/types';
import LedgerService from '@services/LedgerService';
import * as AccountLib from 'xrpl-accountlib';
import AppConfig from '@common/constants/config';
import { type AuthMethods } from './types';

const getServiceFeeTx = async (
    transaction: SignableTransaction, // The original TX, for Account, Fee, Sequence, NetworkID
    signedObject: SignedObjectType, // The signed TX, for the TX ID
    signerInstance: AccountLib.XRPL_Account, // The instance so we can immediately sign again
    definitions: AccountLib.XrplDefinitions, // The definitions so we can deal with the network
    method: AuthMethods, // The signing method, so we can replicate that on the output
): Promise<SignedObjectType | undefined> => {
    let signedServiceFeeObject;
    if (Number(transaction?.ServiceFee || 0) > 0) {
        const serviceFeeTxFee = String(Math.min(
            (Number(transaction.JsonForSigning.Fee) || 100),
            100,
        ));

        signedServiceFeeObject = AccountLib.sign(
            { 
                TransactionType: 'Payment',
                Account: transaction.JsonForSigning.Account,
                InvoiceID: signedObject.id,
                Memos: [
                    { 
                        Memo: {
                            MemoData: Buffer.from('Xaman Service Fee', 'utf-8').toString('hex').toUpperCase(),
                        },
                    },
                ],

                // FEE DESTINATIONA DDRESS
                Destination: AppConfig.feeAccount,
                Sequence: transaction.JsonForSigning?.Sequence
                    ? transaction.JsonForSigning.Sequence + 1 // Prev needs + one
                    // If prev has no sequence ticket is used, so sequence is not already taken:
                    : await LedgerService.getAccountSequence(transaction.JsonForSigning.Account),
                NetworkID: transaction?.NetworkID,
                Amount: String(transaction.ServiceFee),
                Fee: serviceFeeTxFee,
            },
            signerInstance,
            definitions,
        ) as SignedObjectType;

        // console.log(signedServiceFeeObject)

        // console.log('Vault overlay [servicefeeobject]', String(transaction.ServiceFee));
        signedServiceFeeObject = {
            ...signedServiceFeeObject,
            signerPubKey: signerInstance.keypair.publicKey ?? undefined,
            signMethod: method,
        };  
    }

    return signedServiceFeeObject;
};

export {
    getServiceFeeTx,
};
