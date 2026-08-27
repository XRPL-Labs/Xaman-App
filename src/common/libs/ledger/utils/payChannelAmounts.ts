/**
 * PayChannel Amount is the total allocated; Balance is already paid out.
 * Remaining spendable is Amount - Balance. Amounts may be native, IOU, or MPT.
 */
import BigNumber from 'bignumber.js';

import NetworkService from '@services/NetworkService';

import { AmountParser } from '@common/libs/ledger/parser/common';
import { AmountType } from '@common/libs/ledger/parser/types';
import { TransactionMetadata } from '@common/libs/ledger/types/transaction';

export const parsePayChannelAmount = (raw: unknown): AmountType | undefined => {
    if (typeof raw === 'undefined' || raw === null) {
        return undefined;
    }

    if (typeof raw === 'string') {
        return {
            currency: NetworkService.getNativeAsset(),
            value: new AmountParser(raw).dropsToNative().toString(),
        };
    }

    if (typeof raw === 'object') {
        const amount = raw as { value?: string; currency?: string; issuer?: string; mpt_issuance_id?: string };
        if (typeof amount.value === 'undefined') {
            return undefined;
        }
        return {
            currency: amount.currency || NetworkService.getNativeAsset(),
            value: String(amount.value),
            issuer: amount.issuer,
            mpt_issuance_id: amount.mpt_issuance_id,
        };
    }

    return undefined;
};

const sameAsset = (left: AmountType, right: AmountType): boolean => {
    return (
        left.currency === right.currency &&
        left.issuer === right.issuer &&
        left.mpt_issuance_id === right.mpt_issuance_id
    );
};

export const remainingPayChannelAmount = (
    amount?: AmountType,
    balance?: AmountType,
): AmountType | undefined => {
    if (!amount) {
        return undefined;
    }
    if (!balance) {
        return { ...amount };
    }
    if (!sameAsset(amount, balance)) {
        return { ...amount };
    }

    const remaining = new BigNumber(amount.value).minus(balance.value);
    return {
        ...amount,
        value: remaining.isNegative() ? '0' : remaining.toString(10),
    };
};

export const payChannelAmountsFromMeta = (
    meta?: TransactionMetadata,
    channelId?: string,
): { amount?: AmountType; balance?: AmountType; previousBalance?: AmountType } => {
    const nodes = meta?.AffectedNodes || [];

    for (const node of nodes) {
        const wrapped =
            (node as any).ModifiedNode || (node as any).DeletedNode || (node as any).CreatedNode;
        if (wrapped?.LedgerEntryType !== 'PayChannel') {
            continue;
        }
        if (channelId && wrapped.LedgerIndex && wrapped.LedgerIndex !== channelId) {
            continue;
        }

        const fields = wrapped.FinalFields || wrapped.NewFields || {};
        const previous = wrapped.PreviousFields || {};
        return {
            amount: parsePayChannelAmount(fields.Amount ?? previous.Amount),
            balance: parsePayChannelAmount(fields.Balance),
            previousBalance: parsePayChannelAmount(previous.Balance),
        };
    }

    return {};
};
