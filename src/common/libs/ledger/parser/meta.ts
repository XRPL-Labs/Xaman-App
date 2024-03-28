// https://github.com/ripple/ripple-lib-extensions/tree/d266933698a38c51878b4b8806b39ca264526fdc/transactionparser

import BigNumber from 'bignumber.js';
import { compact, flatMap, flatten, groupBy, map, mapValues } from 'lodash';

import NetworkService from '@services/NetworkService';

import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';
import {
    CreatedNode,
    DeletedNode,
    DiffType,
    ModifiedNode,
    TransactionMetadata,
} from '@common/libs/ledger/types/transaction';

/* Types ==================================================================== */
import { BalanceChangeType, OfferStatus, OperationActions, OwnerCountChangeType } from './types';
import { HookExecution } from '../types/common';

export type NodeWithDiffType =
    | (CreatedNode & {
          diffType: DiffType.CreatedNode;
      })
    | (DeletedNode & {
          diffType: DiffType.DeletedNode;
      })
    | (ModifiedNode & {
          diffType: DiffType.ModifiedNode;
      });

export type QuantityType = {
    address: string;
    balance: {
        issuer?: string;
        currency: string;
        value: string;
        action: OperationActions;
    };
};

/* Class ==================================================================== */
class Meta {
    nodes: NodeWithDiffType[];
    hookExecutions: HookExecution[];

    constructor(meta: TransactionMetadata | Record<string, never>) {
        this.nodes = meta?.AffectedNodes?.reduce((nodesWithDiffType, affectedNode) => {
            if (typeof affectedNode === 'object' && Object.keys(affectedNode)[0]) {
                const diffType = Object.keys(affectedNode)[0] as DiffType;
                const node = affectedNode[diffType] as any;

                nodesWithDiffType.push({
                    ...node,
                    diffType,
                });
            }

            return nodesWithDiffType;
        }, [] as NodeWithDiffType[]);

        this.hookExecutions = meta?.HookExecutions?.map((execution) => execution.HookExecution) || [];
    }

    private getOperationAction = (value: BigNumber): OperationActions => {
        if (value.isGreaterThan(0)) {
            return OperationActions.INC;
        }
        if (value.isLessThan(0)) {
            return OperationActions.DEC;
        }
        return OperationActions.INC;
    };

    private combineChanges = (group: any) => {
        return map(
            groupBy(group, (node) => [node.balance.action, node.balance.currency]),
            (changes) => {
                const change = changes[0].balance;
                // in most of the case's this applies
                if (changes.length === 1) {
                    return change;
                }
                // in some case's like applied path multiple of same currency can be transferred
                // we need to combine the values without considering the issuer
                return {
                    currency: change.currency,
                    issuer: change.issuer,
                    value: BigNumber.sum(...flatMap(changes, 'balance.value'))
                        .decimalPlaces(8)
                        .toString(10),
                    action: change.action,
                };
            },
        );
    };

    private groupByAddress = (balanceChanges: QuantityType[]) => {
        return mapValues(groupBy(balanceChanges, 'address'), this.combineChanges);
    };

    private parseValue = (item: { value: string } | string) => {
        return new BigNumber(typeof item === 'object' ? item.value : item);
    };

    private computeOwnerCountChange = (node: ModifiedNode): BigNumber | null => {
        if (typeof node.FinalFields?.OwnerCount === 'number' && typeof node.PreviousFields?.OwnerCount === 'number') {
            return new BigNumber(node.FinalFields.OwnerCount).minus(node.PreviousFields.OwnerCount);
        }
        return null;
    };

    private computeBalanceChange = (node: NodeWithDiffType): BigNumber | null => {
        let value = null;

        if (node.diffType === DiffType.CreatedNode && node.NewFields?.Balance) {
            value = this.parseValue(node.NewFields.Balance);
        }

        if (node.diffType === DiffType.ModifiedNode && node.FinalFields?.Balance && node.PreviousFields?.Balance) {
            value = this.parseValue(node.FinalFields?.Balance).minus(this.parseValue(node.PreviousFields?.Balance));
        }

        return value === null ? null : value.isZero() ? null : value;
    };

    private parseOwnerCountQuantity = (
        node: NodeWithDiffType,
        computeParser: (node: NodeWithDiffType) => BigNumber | null,
    ): OwnerCountChangeType | null => {
        const value = computeParser(node);

        if (value === null) {
            return null;
        }

        let Account;
        if (node.diffType === DiffType.CreatedNode) {
            Account = node.NewFields.Account;
        } else if (node.FinalFields) {
            Account = node.FinalFields.Account;
        }

        return {
            address: Account,
            value: value.absoluteValue().toNumber(),
            action: this.getOperationAction(value),
        };
    };

    private parseNativeQuantity = (
        node: NodeWithDiffType,
        valueCalculator: (node: NodeWithDiffType) => BigNumber | null,
    ): QuantityType | null => {
        const calculatedValue = valueCalculator(node);

        if (calculatedValue === null) {
            return null;
        }

        let Account;
        if (node.diffType === DiffType.CreatedNode) {
            Account = node.NewFields.Account;
        } else if (node.FinalFields) {
            Account = node.FinalFields.Account;
        }

        return {
            address: Account,
            balance: {
                currency: NetworkService.getNativeAsset(),
                value: calculatedValue.absoluteValue().dividedBy(1000000.0).decimalPlaces(8).toString(10),
                action: this.getOperationAction(calculatedValue),
            },
        };
    };

    private flipTrustlinePerspective = (quantity: QuantityType, value: BigNumber): QuantityType => {
        const negatedBalance = value.negated();

        return {
            address: quantity.balance.issuer!,
            balance: {
                issuer: quantity.address,
                currency: quantity.balance.currency,
                value: negatedBalance.absoluteValue().decimalPlaces(8).toString(10),
                action: this.getOperationAction(negatedBalance),
            },
        };
    };

    private parseTrustlineQuantity = (
        node: NodeWithDiffType,
        valueCalculator: (node: NodeWithDiffType) => BigNumber | null,
    ) => {
        const value = valueCalculator(node);

        if (value === null) {
            return null;
        }

        /*
         * A trustline can be created with a non-zero starting balance
         * If an offer is placed to acquire an asset with no existing trustline,
         * the trustline can be created when the offer is taken.
         */

        const fields =
            (node.diffType === DiffType.CreatedNode && node.NewFields) ||
            ((node.diffType === DiffType.ModifiedNode || node.diffType === DiffType.DeletedNode) && node.FinalFields);

        if (!fields) {
            return null;
        }

        // the balance is always from low node's perspective
        const result = {
            address: fields.LowLimit.issuer,
            balance: {
                issuer: fields.HighLimit.issuer,
                currency: fields.Balance.currency,
                value: value.absoluteValue().decimalPlaces(8).toString(10),
                action: this.getOperationAction(value),
            },
        };

        return [result, this.flipTrustlinePerspective(result, value)];
    };

    parseOfferStatus = (node: NodeWithDiffType): OfferStatus => {
        if (node.diffType === DiffType.CreatedNode) {
            return OfferStatus.CREATED;
        }
        if (node.diffType === DiffType.ModifiedNode) {
            return OfferStatus.PARTIALLY_FILLED;
        }
        if (node.diffType === DiffType.DeletedNode) {
            // A filled order has previous fields
            if (node.PreviousFields && 'TakerPays' in node.PreviousFields) {
                return OfferStatus.FILLED;
            }
            return OfferStatus.CANCELLED;
        }
        return OfferStatus.UNKNOWN;
    };

    /*
     * Parse the offer status change from the meta
     */
    parseOfferStatusChange = (owner: string, offerIndex: string): OfferStatus => {
        const offerNode = this.nodes.find(
            (node) => node.LedgerEntryType === LedgerEntryTypes.Offer && node.LedgerIndex === offerIndex,
        );

        // default state if offer node not found in meta
        let status = OfferStatus.UNKNOWN;

        // if found then parse the offer status
        if (offerNode) {
            status = this.parseOfferStatus(offerNode);
        }

        // offer is created or not exist, it can be FILLED or PARTIALLY_FILLED or KILLED
        if (status === OfferStatus.CREATED || status === OfferStatus.UNKNOWN) {
            const hasRippleStateChange = this.nodes.find((node) => {
                return (
                    node.diffType === DiffType.ModifiedNode &&
                    node.LedgerEntryType === LedgerEntryTypes.RippleState &&
                    (node.FinalFields?.HighLimit?.issuer === owner || node.FinalFields?.LowLimit?.issuer === owner)
                );
            });

            if (status === OfferStatus.UNKNOWN) {
                if (hasRippleStateChange) {
                    return OfferStatus.FILLED;
                }
                return OfferStatus.KILLED;
            }

            if (status === OfferStatus.CREATED && hasRippleStateChange) {
                return OfferStatus.PARTIALLY_FILLED;
            }
        }

        return status;
    };

    /*
     * Parse the balance changes from the meta
     */
    parseBalanceChanges = (): { [key: string]: BalanceChangeType[] } => {
        const values = this.nodes.map((node) => {
            if (node.LedgerEntryType === LedgerEntryTypes.AccountRoot) {
                return [this.parseNativeQuantity(node, this.computeBalanceChange)];
            }
            if (node.LedgerEntryType === LedgerEntryTypes.RippleState) {
                return this.parseTrustlineQuantity(node, this.computeBalanceChange);
            }
            return [];
        });

        return this.groupByAddress(compact(flatten(values)));
    };

    /*
     * Parse the account owner count change from the meta
     */
    parseOwnerCountChanges = (): OwnerCountChangeType[] => {
        return this.nodes.reduce((ownerCountChanges, node) => {
            if (node.diffType === DiffType.ModifiedNode && node.LedgerEntryType === LedgerEntryTypes.AccountRoot) {
                const change = this.parseOwnerCountQuantity(node, this.computeOwnerCountChange);
                if (change) {
                    ownerCountChanges.push(change);
                }
            }
            return ownerCountChanges;
        }, [] as OwnerCountChangeType[]);
    };

    /*
     * Parse the generated ticket sequences from the meta
     */
    parseTicketSequences = (): number[] => {
        return this.nodes.reduce((ticketSequences, node) => {
            if (node.LedgerEntryType === LedgerEntryTypes.Ticket && node.diffType === DiffType.CreatedNode) {
                const ticketSequence = node.NewFields?.TicketSequence as number;
                ticketSequences.push(ticketSequence);
            }
            return ticketSequences;
        }, [] as number[]);
    };

    /*
     * Parse the hook executions from the meta
     */
    parseHookExecutions = (): HookExecution[] => {
        // if hook executions already in the meta return
        if (this.hookExecutions) {
            return this.hookExecutions;
        }

        return this.nodes.reduce((hookExecutions, node) => {
            if (node.diffType === DiffType.CreatedNode && node.LedgerEntryType === LedgerEntryTypes.EmittedTxn) {
                hookExecutions.push(node.NewFields.EmittedTxn as HookExecution);
            }

            return hookExecutions;
        }, [] as HookExecution[]);
    };

    /*
     * Parse the Account ID of the AMM account
     */
    parseAMMAccountID = () => {
        const ammNode = this.nodes.find((node) => node.LedgerEntryType === LedgerEntryTypes.AMM);

        if (ammNode && ammNode.diffType === DiffType.CreatedNode) {
            return ammNode.NewFields?.Account;
        }
        if (ammNode && ammNode.diffType === DiffType.ModifiedNode) {
            return ammNode.FinalFields?.Account;
        }

        return undefined;
    };
}

export default Meta;
