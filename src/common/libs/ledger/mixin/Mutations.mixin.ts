import BigNumber from 'bignumber.js';

import NetworkService from '@services/NetworkService';

import { EncodeCTID } from '@common/utils/codec';
import { StringTypeCheck } from '@common/utils/string';

import LedgerDate from '@common/libs/ledger/parser/common/date';

import Meta from '@common/libs/ledger/parser/meta';

import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { OperationActions, TransactionResult } from '@common/libs/ledger/parser/types';
import { HookExecution } from '@common/libs/ledger/types/common';

/* Types ==================================================================== */
import { Constructor, MutationsMixinType } from './types';

/* Mixin ==================================================================== */
export function MutationsMixin<TBase extends Constructor>(Base: TBase) {
    return class extends Base implements MutationsMixinType {
        private BalanceChanges: Map<string, any>;
        private OwnerCountChanges: Map<string, any>;
        private HookExecutions: HookExecution[];

        constructor(...args: any[]) {
            super(...args);

            // memorize balance and owner count changes
            this.BalanceChanges = new Map();
            this.OwnerCountChanges = new Map();
            this.HookExecutions = [];
        }

        /**
         * get transaction balance changes
         * @returns changes
         */
        BalanceChange(owner?: string) {
            if (!owner) {
                owner = this.Account!;
            }

            // if already calculated return value
            if (this.BalanceChanges.has(owner)) {
                return this.BalanceChanges.get(owner);
            }

            let balanceChanges = new Meta(this._meta).parseBalanceChanges()[owner];

            // no balance changes
            if (!balanceChanges) {
                this.BalanceChanges.set(owner, undefined);
                return undefined;
            }

            // if cross currency remove fee from changes
            if (balanceChanges?.filter((changes) => changes.action === OperationActions.DEC).length > 1) {
                const decreaseNative = balanceChanges.find(
                    (change) =>
                        change.action === OperationActions.DEC && change.currency === NetworkService.getNativeAsset(),
                );

                if (decreaseNative?.value === this.Fee?.value) {
                    balanceChanges = balanceChanges.filter(
                        (item) =>
                            !(
                                item.action === OperationActions.DEC &&
                                item.currency === NetworkService.getNativeAsset()
                            ),
                    );
                }
            }

            const changes = {
                sent: balanceChanges.find((change) => change.action === OperationActions.DEC),
                received: balanceChanges.find((change) => change.action === OperationActions.INC),
            };

            // remove fee from transaction owner balance changes
            // this should apply for NFTokenAcceptOffer and OfferCreate transactions as well
            let feeFieldKey = undefined as unknown as 'sent' | 'received';
            if (owner === this.Account!) {
                if (changes.sent?.currency === NetworkService.getNativeAsset()) {
                    feeFieldKey = 'sent';
                } else if (
                    (this.TransactionType === TransactionTypes.NFTokenAcceptOffer ||
                        this.TransactionType === TransactionTypes.OfferCreate) &&
                    changes.received?.currency === NetworkService.getNativeAsset()
                ) {
                    feeFieldKey = 'received';
                }
            }

            if (feeFieldKey) {
                const afterFee = new BigNumber(changes[feeFieldKey]!.value).minus(new BigNumber(this.Fee!.value));
                if (afterFee.isZero()) {
                    changes[feeFieldKey] = undefined;
                } else if (
                    afterFee.isNegative() &&
                    this.TransactionType === TransactionTypes.NFTokenAcceptOffer &&
                    feeFieldKey === 'sent'
                ) {
                    changes.sent = undefined;
                    changes.received = {
                        action: OperationActions.INC,
                        currency: NetworkService.getNativeAsset(),
                        value: afterFee.absoluteValue().decimalPlaces(8).toString(10),
                    };
                } else {
                    changes[feeFieldKey]!.value = afterFee.decimalPlaces(8).toString(10);
                }
            }

            // memorize the changes for this account
            this.BalanceChanges.set(owner, changes);

            return changes;
        }

        /**
         * get transaction balance changes
         * @returns changes
         */
        OwnerCountChange(owner?: string) {
            if (!owner) {
                owner = this.Account!;
            }

            // if value is already set return
            if (this.OwnerCountChanges.has(owner)) {
                return this.OwnerCountChanges.get(owner);
            }

            const ownerChanges = new Meta(this._meta)
                .parseOwnerCountChanges()
                .find((change) => change.address === owner);

            // memorize owner count changes
            this.OwnerCountChanges.set(owner, ownerChanges);

            return ownerChanges;
        }

        /**
         * get transaction hook executions
         * @returns changes
         */
        HookExecution() {
            // if value is already set return
            if (this.HookExecutions) {
                return this.HookExecutions;
            }

            const hookExecutions = new Meta(this._meta).parseHookExecutions();

            // memorize hook executions
            this.HookExecutions = hookExecutions;

            return hookExecutions;
        }

        /**
         * check if transaction contain any xApp identifier and return it
         * @returns {string} xApp identifier if found any
         */
        getXappIdentifier(): string | undefined {
            const memos = this.Memos;
            if (!memos) return undefined;

            for (const memo of memos) {
                if (
                    ['xumm/xapp', 'xaman/xapp'].includes(memo.MemoType ?? '') &&
                    StringTypeCheck.isValidXAppIdentifier(memo.MemoData ?? '')
                ) {
                    return memo.MemoData;
                }
            }

            return undefined;
        }

        get EmitDetails(): any | undefined {
            return this._tx.EmitDetails;
        }

        get Date(): string | undefined {
            const date = this._tx?.date as string | undefined;
            if (typeof date === 'undefined') return undefined;
            const ledgerDate = new LedgerDate(date);
            return ledgerDate.toISO8601();
        }

        get TransactionResult(): TransactionResult {
            const transactionResult = this._meta?.TransactionResult;

            return {
                success: transactionResult === 'tesSUCCESS',
                code: transactionResult,
                message: undefined,
            };
        }

        get CTID(): string {
            // check if CTID is already in the transaction response
            const ctid = this._tx?.ctid as string | undefined;

            if (typeof ctid === 'undefined') {
                // calculate the ctid
                return EncodeCTID(this.LedgerIndex, this.TransactionIndex, NetworkService.getNetworkId());
            }

            return ctid;
        }

        get LedgerIndex(): number {
            return this._tx.ledger_index as number;
        }

        get TransactionIndex(): number {
            return this._meta.TransactionIndex;
        }
    };
}
