import BigNumber from 'bignumber.js';

import NetworkService from '@services/NetworkService';

import { EncodeCTID } from '@common/utils/codec';
import { StringTypeCheck } from '@common/utils/string';

import LedgerDate from '@common/libs/ledger/parser/common/date';

import Meta from '@common/libs/ledger/parser/meta';

import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { OperationActions, OwnerCountChangeType, TransactionResult } from '@common/libs/ledger/parser/types';
import { HookExecution } from '@common/libs/ledger/types/common';

/* Types ==================================================================== */
import { Constructor, MutationsMixinType, BalanceChanges } from './types';

/* Mixin ==================================================================== */
export function MutationsMixin<TBase extends Constructor>(Base: TBase) {
    return class extends Base implements MutationsMixinType {
        private _BalanceChanges: Map<string, BalanceChanges>;
        private _OwnerCountChanges: Map<string, OwnerCountChangeType | undefined>;
        private _HookExecutions: HookExecution[] | undefined;

        constructor(...args: any[]) {
            super(...args);

            // memorize balance and owner count changes
            this._BalanceChanges = new Map();
            this._OwnerCountChanges = new Map();
            this._HookExecutions = undefined;
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
            if (this._BalanceChanges.has(owner)) {
                return this._BalanceChanges.get(owner)!;
            }

            // try to parse the balance changes from meta-data
            let balanceChanges = new Meta(this._meta).parseBalanceChanges()[owner];

            // no balance changes, just cache the value and return
            if (!balanceChanges || balanceChanges.length === 0) {
                return this._BalanceChanges
                    .set(owner, {
                        [OperationActions.DEC]: [],
                        [OperationActions.INC]: [],
                    })
                    .get(owner)!;
            }

            // we have multiple balance decrease, one them can be the fee,
            // as we don't want to show the fee as balance change, we remove it from the list of changes
            // example: [{ currency: 'USD', value: '1337'}, { currency: 'XRP', value: '0.0000015'}]
            const deductedBalanceChanges = balanceChanges?.filter((changes) => changes.action === OperationActions.DEC);

            if (deductedBalanceChanges.length > 1) {
                const deductedNative = deductedBalanceChanges.find(
                    (change) => change.currency === NetworkService.getNativeAsset(),
                );

                if (deductedNative?.value === this.Fee?.value) {
                    // remove the fee change from the list
                    balanceChanges = balanceChanges.filter(
                        (item) =>
                            !(
                                item.action === OperationActions.DEC &&
                                item.currency === NetworkService.getNativeAsset()
                            ),
                    );
                }
            }

            // deduct fee from transaction owners native balance change
            // this should apply for NFTokenAcceptOffer and OfferCreate transactions as well
            let feeIncludedBalanceIndex = -1;
            // only apply for when the owner of transaction
            if (owner === this.Account!) {
                // first check native asset decrease
                feeIncludedBalanceIndex = balanceChanges.findIndex(
                    (change) =>
                        change.action === OperationActions.DEC && change.currency === NetworkService.getNativeAsset(),
                );

                // if not decrease then we should look for increase values
                if (
                    feeIncludedBalanceIndex === -1 &&
                    (this.TransactionType === TransactionTypes.NFTokenAcceptOffer ||
                        this.TransactionType === TransactionTypes.OfferCreate)
                ) {
                    feeIncludedBalanceIndex = balanceChanges.findIndex(
                        (change) =>
                            change.action === OperationActions.INC &&
                            change.currency === NetworkService.getNativeAsset(),
                    );
                }
            }

            if (feeIncludedBalanceIndex > -1) {
                const afterFee = new BigNumber(balanceChanges[feeIncludedBalanceIndex].value).minus(this.Fee!.value);
                if (afterFee.isZero()) {
                    // remove the item from balanceChanges
                    balanceChanges.splice(feeIncludedBalanceIndex, 1);
                } else if (
                    afterFee.isNegative() &&
                    this.TransactionType === TransactionTypes.NFTokenAcceptOffer &&
                    balanceChanges[feeIncludedBalanceIndex].action === OperationActions.DEC
                ) {
                    // replace the action with Increase and positive the afterFee
                    balanceChanges[feeIncludedBalanceIndex].action = OperationActions.INC;
                    balanceChanges[feeIncludedBalanceIndex].value = afterFee
                        .absoluteValue()
                        .decimalPlaces(8)
                        .toString(10);
                } else {
                    // change the fee included balance change to after fee value
                    balanceChanges[feeIncludedBalanceIndex].value = afterFee.decimalPlaces(8).toString(10);
                }
            }

            // memorize the changes for this owner
            return this._BalanceChanges
                .set(owner, {
                    [OperationActions.DEC]: balanceChanges?.filter((c) => c.action === OperationActions.DEC) ?? [],
                    [OperationActions.INC]: balanceChanges?.filter((c) => c.action === OperationActions.INC) ?? [],
                })
                .get(owner)!;
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
            if (this._OwnerCountChanges.has(owner)) {
                return this._OwnerCountChanges.get(owner);
            }

            const ownerChanges = new Meta(this._meta)
                .parseOwnerCountChanges()
                .find((change) => change.address === owner);

            // memorize owner count changes
            this._OwnerCountChanges.set(owner, ownerChanges);

            return ownerChanges;
        }

        /**
         * get transaction hook executions
         * @returns changes
         */
        HookExecution() {
            // if value is already set return
            if (this._HookExecutions) {
                return this._HookExecutions;
            }

            const hookExecutions = new Meta(this._meta).parseHookExecutions();

            // memorize hook executions
            this._HookExecutions = hookExecutions;

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

        /**
         * Retrieves the hooks emit details.
         * @returns {any | undefined} The emit details, or undefined if not available.
         */
        get EmitDetails(): any | undefined {
            return this._tx.EmitDetails;
        }

        /**
         * Retrieve the transaction date as a string in ISO 8601 format.
         *
         * @return {string | undefined} The date in ISO 8601 format or undefined if the date is not available.
         */
        get Date(): string | undefined {
            const date = this._tx?.date as string | undefined;
            if (typeof date === 'undefined') return undefined;
            const ledgerDate = new LedgerDate(date);
            return ledgerDate.toISO8601();
        }

        /**
         * Retrieve the transaction result.
         *
         * @return {TransactionResult} The transaction result object.
         */
        get TransactionResult(): TransactionResult {
            const transactionResult = this._meta?.TransactionResult;

            return {
                success: transactionResult === 'tesSUCCESS',
                code: transactionResult,
                message: undefined,
            };
        }

        /**
         * Returns the CTID (Concise Transaction ID) for the transaction.
         * https://github.com/XRPLF/XRPL-Standards/tree/master/XLS-0037d-concise-transaction-identifier-ctid
         *
         * @returns {string} The CTID for the transaction.
         */
        get CTID(): string {
            // check if CTID is already in the transaction response
            const ctid = this._tx?.ctid as string | undefined;

            if (typeof ctid === 'undefined') {
                // calculate the ctid
                return EncodeCTID(this.LedgerIndex, this.TransactionIndex, NetworkService.getNetworkId());
            }

            return ctid;
        }

        /**
         * Retrieves the validated ledger index associated with the current instance.
         *
         * @return {number} The ledger index.
         */
        get LedgerIndex(): number {
            return this._tx.ledger_index as number;
        }

        /**
         * Retrieves the transaction index from the metadata.
         *
         * @returns {number} The transaction index.
         */
        get TransactionIndex(): number {
            return this._meta.TransactionIndex;
        }
    };
}
