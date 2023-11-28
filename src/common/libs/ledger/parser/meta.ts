// https://github.com/ripple/ripple-lib-extensions/tree/d266933698a38c51878b4b8806b39ca264526fdc/transactionparser
import BigNumber from 'bignumber.js';
import { compact, find, flatMap, flatten, groupBy, has, get, isEmpty, map, mapValues } from 'lodash';

import NetworkService from '@services/NetworkService';

/* Types ==================================================================== */
import { BalanceChangeType, OfferStatus } from './types';

/* Class ==================================================================== */
class Meta {
    nodes: any[];

    constructor(meta: any) {
        if (!meta.AffectedNodes) {
            this.nodes = [];
        }
        this.nodes = meta.AffectedNodes?.map(this.normalizeNode) || [];
    }

    private normalizeNode = (affectedNode: any) => {
        const diffType = Object.keys(affectedNode)[0];
        const node = affectedNode[diffType];
        return {
            ...node,
            diffType,
            entryType: node.LedgerEntryType,
            ledgerIndex: node.LedgerIndex,
            newFields: node.NewFields || {},
            finalFields: node.FinalFields || {},
            previousFields: node.PreviousFields || {},
        };
    };

    private combineChanges = (group: any) => {
        return map(
            groupBy(group, (node) => [node.balance.action, node.balance.currency]),
            (changes) => {
                const change = changes[0].balance;
                // must of the case this applies
                if (changes.length === 1) {
                    return change;
                }
                // in some case's like applied path multiple of same currency can be transferred
                // so we need to combine the values with out considering the issuer
                return {
                    currency: change.currency,
                    issuer: change.issuer,
                    // @ts-ignore
                    value: BigNumber.sum(...flatMap(changes, 'balance.value'))
                        .decimalPlaces(8)
                        .toString(10),
                    action: change.action,
                };
            },
        );
    };

    private groupByAddress = (balanceChanges: any) => {
        return mapValues(groupBy(balanceChanges, 'address'), this.combineChanges);
    };

    private parseValue = (value: any) => {
        return new BigNumber(value.value || value);
    };

    private computeOwnerCountChange = (node: any) => {
        let value = null;
        if (has(node, 'finalFields.OwnerCount') && has(node, 'previousFields.OwnerCount')) {
            value = node.finalFields.OwnerCount - node.previousFields.OwnerCount;
        }
        return value;
    };

    private computeBalanceChange = (node: any) => {
        let value = null;
        if (node.newFields.Balance) {
            value = this.parseValue(node.newFields.Balance);
        } else if (node.previousFields.Balance && node.finalFields.Balance) {
            value = this.parseValue(node.finalFields.Balance).minus(this.parseValue(node.previousFields.Balance));
        }
        return value === null ? null : value.isZero() ? null : value;
    };

    private parseFinalBalance = (node: any) => {
        if (node.newFields.Balance) {
            return this.parseValue(node.newFields.Balance);
        }
        if (node.finalFields.Balance) {
            return this.parseValue(node.finalFields.Balance);
        }
        return null;
    };

    private parseOwnerCountQuantity = (node: any, valueParser: any) => {
        const value = valueParser(node);

        if (value === null) {
            return null;
        }

        const valueNumber = new BigNumber(value);

        return {
            address: node.finalFields.Account || node.newFields.Account,
            value: valueNumber.absoluteValue().toNumber(),
            action: valueNumber.isNegative() ? 'DEC' : 'INC',
        };
    };

    private parseNativeQuantity = (node: any, valueParser: any) => {
        const value = valueParser(node);

        if (value === null) {
            return null;
        }

        const valueNumber = new BigNumber(value);

        return {
            address: node.finalFields.Account || node.newFields.Account,
            balance: {
                currency: NetworkService.getNativeAsset(),
                value: valueNumber.absoluteValue().dividedBy(1000000.0).decimalPlaces(8).toString(10),
                action: valueNumber.isNegative() ? 'DEC' : 'INC',
            },
        };
    };

    private flipTrustlinePerspective = (quantity: any, value: BigNumber) => {
        const negatedBalance = value.negated();

        return {
            address: quantity.balance.issuer,
            balance: {
                issuer: quantity.address,
                currency: quantity.balance.currency,
                value: negatedBalance.absoluteValue().decimalPlaces(8).toString(10),
                action: negatedBalance.isNegative() ? 'DEC' : 'INC',
            },
        };
    };

    private parseTrustlineQuantity = (node: any, valueParser: any) => {
        const value = valueParser(node);

        if (value === null) {
            return null;
        }

        /*
         * A trustline can be created with a non-zero starting balance
         * If an offer is placed to acquire an asset with no existing trustline,
         * the trustline can be created when the offer is taken.
         */
        const fields = isEmpty(node.newFields) ? node.finalFields : node.newFields;

        // the balance is always from low node's perspective
        const result = {
            address: fields.LowLimit.issuer,
            balance: {
                issuer: fields.HighLimit.issuer,
                currency: fields.Balance.currency,
                value: value.absoluteValue().decimalPlaces(8).toString(10),
                action: value.isNegative() ? 'DEC' : 'INC',
            },
        };

        return [result, this.flipTrustlinePerspective(result, value)];
    };

    parseOfferStatus = (node: any): OfferStatus => {
        if (node.diffType === 'CreatedNode') {
            return OfferStatus.CREATED;
        }
        if (node.diffType === 'ModifiedNode') {
            return OfferStatus.PARTIALLY_FILLED;
        }
        if (node.diffType === 'DeletedNode') {
            // A filled order has previous fields
            if (has(node, 'previousFields.TakerPays')) {
                return OfferStatus.FILLED;
            }
            return OfferStatus.CANCELLED;
        }
        return OfferStatus.UNKNOWN;
    };

    parseOfferStatusChange = (owner: string, offerIndex: string): OfferStatus => {
        const node = find(this.nodes, { entryType: 'Offer', LedgerIndex: offerIndex });

        // default state if offer node not found in meta
        let status = OfferStatus.UNKNOWN;

        // if found then parse the offer status
        if (node) {
            status = this.parseOfferStatus(node);
        }

        // offer is created or not exist, it can be FILLED or PARTIALLY_FILLED or KILLED
        if (status === OfferStatus.CREATED || status === OfferStatus.UNKNOWN) {
            const hasRippleStateChange = find(this.nodes, (n) => {
                return (
                    n.diffType === 'ModifiedNode' &&
                    n.entryType === 'RippleState' &&
                    (get(n, 'finalFields.HighLimit.issuer') === owner ||
                        get(n, 'finalFields.LowLimit.issuer') === owner)
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

    parseBalanceChanges = (): { [key: string]: BalanceChangeType[] } => {
        const values = this.nodes.map((node) => {
            if (node.entryType === 'AccountRoot') {
                return [this.parseNativeQuantity(node, this.computeBalanceChange)];
            }
            if (node.entryType === 'RippleState') {
                return this.parseTrustlineQuantity(node, this.computeBalanceChange);
            }
            return [];
        });

        // @ts-ignore
        return this.groupByAddress(compact(flatten(values)));
    };

    parseOwnerCountChanges = () => {
        const values = this.nodes.map((node) => {
            if (node.entryType === 'AccountRoot') {
                return this.parseOwnerCountQuantity(node, this.computeOwnerCountChange);
            }
            return undefined;
        });

        return compact(values);
    };

    parseTicketSequences = (): number[] => {
        const values = this.nodes.map((node) => {
            if (node.entryType === 'Ticket') {
                return node.newFields?.TicketSequence;
            }
            return undefined;
        });

        return compact(values);
    };
}

export default Meta;
