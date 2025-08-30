import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { AccountID, STArray } from '@common/libs/ledger/parser/fields';
import { PermissionEntries } from '@common/libs/ledger/parser/fields/codec';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';
import NetworkService from '@services/NetworkService';

const customPerms: { [key: number]: string } = {
    65537: 'TrustlineAuthorize',
    65538: 'TrustlineFreeze',
    65539: 'TrustlineUnfreeze',
    65540: 'AccountDomainSet',
    65541: 'AccountEmailHashSet',
    65542: 'AccountMessageKeySet',
    65543: 'AccountTransferRateSet',
    65544: 'AccountTickSizeSet',
    65545: 'PaymentMint',
    65546: 'PaymentBurn',
    65547: 'MPTokenIssuanceLock',
    65548: 'MPTokenIssuanceUnlock',
};

const trustedNative = [
    31, // "AMMClawback": 31,
    37, // "AMMWithdraw": 37,
    18, // "CheckCancel": 18,
    17, // "CheckCash": 17,
    30, // "Clawback": 30,
    59, // "CredentialAccept": 59,
    58, // "CredentialCreate": 58,
    60, // "CredentialDelete": 60,
    50, // "DIDDelete": 50,
    49, // "DIDSet": 49,
    19, // "DepositPreauth": 19,
    4, // "EscrowCancel": 4,
    2, // "EscrowFinish": 2,
    57, // "MPTokenAuthorize": 57,
    54, // "MPTokenIssuanceCreate": 54,
    55, // "MPTokenIssuanceDestroy": 55,
    56, // "MPTokenIssuanceSet": 56,
    29, // "NFTokenAcceptOffer": 29,
    26, // "NFTokenBurn": 26,
    28, // "NFTokenCancelOffer": 28,
    25, // "NFTokenMint": 25,
    61, // "NFTokenModify": 61,
    8, // "OfferCancel": 8,
    15, // "PaymentChannelClaim": 15,
    14, // "PaymentChannelFund": 14,
    10, // "TicketCreate": 10,
];

/* Class ==================================================================== */
class DelegateSet extends BaseGenuineTransaction {
    public static Type = TransactionTypes.DelegateSet as const;
    public readonly Type = DelegateSet.Type;

    public readonly ___translatedDelegations: string[];
    public readonly ___dangerPerms: string[] = [];

    public static Fields: { [key: string]: FieldConfig } = {
        Authorize: { type: AccountID },
        Permissions: { type: STArray, codec: PermissionEntries },
    };

    declare Authorize: FieldReturnType<typeof AccountID>;
    declare Permissions: FieldReturnType<typeof STArray, typeof PermissionEntries>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        this.___translatedDelegations = (this.Permissions || []).map((p) => {
            const transactionDefinitions = NetworkService.getRawNetworkDefinitions()?.TRANSACTION_TYPES || {};
            const matchingTx = Object.keys(transactionDefinitions).filter(
                (v) => transactionDefinitions[v] === p.PermissionValue,
            )?.[0];

            if (matchingTx) {
                if (trustedNative.indexOf(Number(p.PermissionValue)) < 0) {
                    this.___dangerPerms.push(String(matchingTx));

                    return `${String(matchingTx)} (!)`;
                }
                return String(matchingTx);
            }

            if (customPerms?.[Number(p.PermissionValue)]) return customPerms?.[Number(p.PermissionValue)];

            return `${String(p.PermissionValue)}`;
        });

        if (!this?.Permissions) {
            this.Permissions = [];
        }

        // set transaction type
        this.TransactionType = DelegateSet.Type;
    }
}

/* Export ==================================================================== */
export default DelegateSet;
