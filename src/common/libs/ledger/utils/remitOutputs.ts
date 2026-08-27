/**
 * Build synthetic Payment / URITokenMint instances from a Remit so the
 * event-details list can reuse the same EventList Transaction rows as Batch.
 */
import NetworkService from '@services/NetworkService';

import { AmountParser } from '@common/libs/ledger/parser/common';
import { TransactionFactory } from '@common/libs/ledger/factory';
import { MixingTypes, MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { Remit } from '@common/libs/ledger/transactions';
import { Transactions } from '@common/libs/ledger/transactions/types';
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { AmountType } from '@common/libs/ledger/parser/types';

const HEX64 = /^[0-9A-Fa-f]{64}$/;

const ledgerAmount = (amount: AmountType) => {
    const native = NetworkService.getNativeAsset();
    if (!amount.issuer && amount.currency === native) {
        return new AmountParser(amount.value, false).nativeToDrops().toString();
    }
    return {
        currency: amount.currency,
        issuer: amount.issuer,
        value: amount.value,
        mpt_issuance_id: (amount as any).mpt_issuance_id,
    };
};

const uniqueHash = (parent: string, kind: string, index: number): string => {
    const base = (parent && HEX64.test(parent) ? parent : `${parent}0`.repeat(16)).slice(0, 64).padEnd(64, '0');
    const tag = Buffer.from(`${kind}${index}`).toString('hex').toUpperCase().padEnd(8, '0').slice(0, 8);
    return `${tag}${base.slice(8)}`.slice(0, 64).toUpperCase();
};

const asFiniteNumber = (value: unknown): number | undefined =>
    typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const compactDefined = <T extends Record<string, unknown>>(value: T): Partial<T> =>
    Object.fromEntries(Object.entries(value).filter(([, entry]) => typeof entry !== 'undefined')) as Partial<T>;

/**
 * Remit outputs are minted/transferred in the same validated ledger as the parent Remit.
 */
const parentLedgerFields = (item: Remit) => {
    const raw = ((item as any).JsonRaw || (item as any)._tx || {}) as Record<string, unknown>;
    const ledger_index =
        asFiniteNumber((item as MutationsMixinType).LedgerIndex) ??
        asFiniteNumber(raw.ledger_index) ??
        asFiniteNumber(raw.inLedger);
    const date = asFiniteNumber(raw.date);
    const ctid = typeof raw.ctid === 'string' && raw.ctid.length > 0 ? raw.ctid : undefined;

    return compactDefined({
        ledger_index,
        inLedger: ledger_index,
        date,
        ctid,
    });
};

const parentMetaFields = (item: Remit, meta: TransactionMetadata | undefined) => {
    const transactionIndex =
        asFiniteNumber((item as MutationsMixinType).TransactionIndex) ??
        asFiniteNumber(meta?.TransactionIndex) ??
        0;

    return {
        TransactionIndex: transactionIndex,
        TransactionResult: meta?.TransactionResult || 'tesSUCCESS',
        ParentRemitID: item.hash || undefined,
    };
};

const uriTokenIds = (item: Remit): string[] => {
    return (item.URITokenIDs || [])
        .map((entry: any) => (typeof entry === 'string' ? entry : entry?.URITokenID))
        .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0);
};

const mintMeta = (meta: TransactionMetadata | undefined): TransactionMetadata => {
    const nodes = (meta?.AffectedNodes || []).filter(
        (node: any) => node?.CreatedNode?.LedgerEntryType === 'URIToken',
    );
    return { AffectedNodes: nodes };
};

const transferMeta = (tokenId: string, uri?: string): TransactionMetadata => {
    return {
        AffectedNodes: [
            {
                CreatedNode: {
                    LedgerEntryType: 'URIToken',
                    LedgerIndex: tokenId,
                    NewFields: uri ? { URI: uri } : {},
                },
            },
        ],
    };
};

const uriFromMeta = (meta: TransactionMetadata | undefined, tokenId: string): string | undefined => {
    for (const node of meta?.AffectedNodes || []) {
        const created = (node as any).CreatedNode;
        const modified = (node as any).ModifiedNode;
        const entry = created || modified;
        if (entry?.LedgerEntryType !== 'URIToken') {
            continue;
        }
        if (entry.LedgerIndex === tokenId) {
            return entry.NewFields?.URI || entry.FinalFields?.URI;
        }
    }
    return undefined;
};

export const buildRemitOutputTransactions = (
    item: Remit,
): Array<Transactions & MutationsMixinType> => {
    if (item.Type !== 'Remit' && (item as any).TransactionType !== 'Remit') {
        return [];
    }

    const parentHash = item.hash || '';
    const meta = item.MetaData as TransactionMetadata | undefined;
    const outputs: Array<Transactions & MutationsMixinType> = [];
    const mixin = [MixingTypes.Mutation];
    const parentLedger = parentLedgerFields(item);
    const parentMeta = parentMetaFields(item, meta);

    (item.Amounts || []).forEach((amount: AmountType, index: number) => {
        const amountJson = ledgerAmount(amount);
        const json = {
            TransactionType: 'Payment',
            Account: item.Account,
            Destination: item.Destination,
            Amount: amountJson,
            hash: uniqueHash(parentHash, 'p', index),
            ...parentLedger,
        } as TransactionJson;
        if (typeof item.DestinationTag !== 'undefined') {
            json.DestinationTag = item.DestinationTag;
        }
        outputs.push(
            TransactionFactory.getTransaction(
                json,
                { delivered_amount: amountJson, ...parentMeta } as TransactionMetadata,
                mixin,
            ) as Transactions & MutationsMixinType,
        );
    });

    if (item.MintURIToken?.URI) {
        const json = {
            TransactionType: 'URITokenMint',
            Account: item.Account,
            Destination: item.Destination,
            URI: item.MintURIToken.URI,
            hash: uniqueHash(parentHash, 'm', 0),
            ...parentLedger,
        } as TransactionJson;
        if (item.MintURIToken.Digest) {
            (json as any).Digest = item.MintURIToken.Digest;
        }
        outputs.push(
            TransactionFactory.getTransaction(json, { ...mintMeta(meta), ...parentMeta }, mixin) as Transactions &
                MutationsMixinType,
        );
    }

    uriTokenIds(item).forEach((tokenId, index) => {
        const uri = uriFromMeta(meta, tokenId) || '00';
        const json = {
            TransactionType: 'URITokenMint',
            Account: item.Account,
            Destination: item.Destination,
            URI: uri,
            hash: uniqueHash(parentHash, 'u', index),
            ...parentLedger,
        } as TransactionJson;
        outputs.push(
            TransactionFactory.getTransaction(
                json,
                { ...transferMeta(tokenId, uri), ...parentMeta },
                mixin,
            ) as Transactions & MutationsMixinType,
        );
    });

    return outputs;
};
