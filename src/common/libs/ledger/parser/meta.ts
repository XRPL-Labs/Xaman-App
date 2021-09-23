// https://github.com/ripple/ripple-lib-extensions/tree/d266933698a38c51878b4b8806b39ca264526fdc/transactionparser

import { groupBy, mapValues, map, isEmpty, compact, flatten } from 'lodash';
import BigNumber from 'bignumber.js';

import { BalanceChangeType } from './types';

class Meta {
    nodes: any[];

    constructor(meta: any) {
        if (!meta.AffectedNodes) {
            this.nodes = [];
        }
        this.nodes = meta.AffectedNodes.map(this.normalizeNode);
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

    private groupByAddress = (balanceChanges: any) => {
        const grouped = groupBy(balanceChanges, (node) => {
            return node.address;
        });
        return mapValues(grouped, (group) => {
            return map(group, (node) => {
                return node.balance;
            });
        });
    };

    private parseValue = (value: any) => {
        return new BigNumber(value.value || value);
    };

    private computeOwnerCountChange = (node: any) => {
        let value = null;
        if (node.finalFields.OwnerCount && node.previousFields.OwnerCount) {
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

    private parseXRPQuantity = (node: any, valueParser: any) => {
        const value = valueParser(node);

        if (value === null) {
            return null;
        }

        const valueNumber = new BigNumber(value);

        return {
            address: node.finalFields.Account || node.newFields.Account,
            balance: {
                currency: 'XRP',
                // eslint-disable-next-line newline-per-chained-call
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

    parseBalanceChanges = (): { [key: string]: BalanceChangeType[] } => {
        const values = this.nodes.map((node) => {
            if (node.entryType === 'AccountRoot') {
                return [this.parseXRPQuantity(node, this.computeBalanceChange)];
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
}

export default Meta;
