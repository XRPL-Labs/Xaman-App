/* eslint-disable no-lonely-if */
import BigNumber from 'bignumber.js';
import { get, set, has, isUndefined } from 'lodash';

import BaseTransaction from './base';
import Amount from '../parser/common/amount';
import LedgerDate from '../parser/common/date';

/* Types ==================================================================== */
import { AmountType } from '../parser/types';
import { LedgerTransactionType } from '../types';

/* Class ==================================================================== */
class OfferCreate extends BaseTransaction {
    [key: string]: any;

    constructor(tx?: LedgerTransactionType) {
        super(tx);
        // set transaction type if not set
        if (isUndefined(this.Type)) {
            this.Type = 'OfferCreate';
        }

        this.fields = this.fields.concat(['TakerPays', 'TakerGets', 'OfferSequence', 'Expiration']);
    }

    get TakerPays(): AmountType {
        const pays = get(this, ['tx', 'TakerPays']);

        if (isUndefined(pays)) return undefined;

        if (typeof pays === 'string') {
            return {
                currency: 'XRP',
                value: new Amount(pays).dropsToXrp(),
            };
        }

        return {
            currency: pays.currency,
            value: new Amount(pays.value, false).toString(),
            issuer: pays.issuer,
        };
    }

    get TakerGets(): AmountType {
        const gets = get(this, ['tx', 'TakerGets']);

        if (isUndefined(gets)) return undefined;

        if (typeof gets === 'string') {
            return {
                currency: 'XRP',
                value: new Amount(gets).dropsToXrp(),
            };
        }

        return {
            currency: gets.currency,
            value: new Amount(gets.value, false).toString(),
            issuer: gets.issuer,
        };
    }

    set TakerGets(gets: AmountType) {
        if (gets.currency === 'XRP') {
            set(this, 'tx.TakerGets', new Amount(gets.value, false).xrpToDrops());
            return;
        }

        set(this, 'tx.TakerGets', {
            currency: gets.currency,
            value: new Amount(gets.value, false).toString(),
            issuer: gets.issuer,
        });
    }

    set TakerPays(pays: AmountType) {
        if (pays.currency === 'XRP') {
            set(this, 'tx.TakerPays', new Amount(pays.value, false).xrpToDrops());
            return;
        }

        set(this, 'tx.TakerPays', {
            currency: pays.currency,
            value: new Amount(pays.value, false).toString(),
            issuer: pays.issuer,
        });
    }

    get Rate(): number {
        const gets = Number(this.TakerGets.value);
        const pays = Number(this.TakerPays.value);

        let rate = gets / pays;
        rate = this.TakerGets.currency !== 'XRP' ? rate : 1 / rate;

        return new Amount(rate, false).toNumber();
    }

    get OfferSequence(): number {
        return get(this, ['tx', 'OfferSequence']);
    }

    get Expiration(): any {
        const date = get(this, ['tx', 'Expiration'], undefined);
        if (isUndefined(date)) return undefined;
        const ledgerDate = new LedgerDate(date);
        return ledgerDate.toISO8601();
    }

    get Executed(): boolean {
        // check for order object
        let foundOrderObject = false;

        // this will ensure that order is executed
        const affectedNodes = get(this.meta, 'AffectedNodes', []);

        affectedNodes.map((node: any) => {
            if (node.ModifiedNode?.LedgerEntryType === 'Offer' || node.DeletedNode?.LedgerEntryType === 'Offer') {
                foundOrderObject = true;
                return true;
            }
            return false;
        });

        return foundOrderObject;
    }

    get TakerGot(): AmountType {
        const affectedNodes = get(this, ['meta', 'AffectedNodes']);

        if (!affectedNodes) return this.TakerGets;

        const ledgerEntryType = this.TakerGets.currency === 'XRP' ? 'AccountRoot' : 'RippleState';
        const isIOU = this.TakerGets.currency !== 'XRP';

        let takerGot: AmountType;

        affectedNodes.forEach((node: any) => {
            const { ModifiedNode } = node;

            if (!ModifiedNode || get(ModifiedNode, 'LedgerEntryType') !== ledgerEntryType || takerGot) return;

            if (isIOU) {
                if (has(ModifiedNode.FinalFields, 'Balance') && has(ModifiedNode.PreviousFields, 'Balance')) {
                    const balance = new BigNumber(ModifiedNode.FinalFields.Balance.value);
                    const prevBalance = new BigNumber(ModifiedNode.PreviousFields.Balance.value);

                    takerGot = {
                        currency: ModifiedNode.FinalFields.Balance.currency,
                        value: balance.minus(prevBalance).decimalPlaces(6).absoluteValue().toString(10),
                        issuer: ModifiedNode.FinalFields.Balance.issuer,
                    };
                }
            } else {
                if (
                    get(ModifiedNode.FinalFields, 'Account') !== this.Account.address &&
                    has(ModifiedNode.FinalFields, 'Balance') &&
                    has(ModifiedNode.PreviousFields, 'Balance')
                ) {
                    const balance = new BigNumber(ModifiedNode.FinalFields.Balance);
                    const prevBalance = new BigNumber(ModifiedNode.PreviousFields.Balance);

                    takerGot = {
                        currency: 'XRP',
                        value: balance
                            .minus(prevBalance)
                            .dividedBy(1000000.0)
                            .absoluteValue()
                            .decimalPlaces(6)
                            .toString(10),
                    };
                }
            }
        });

        if (!takerGot) {
            return this.TakerGets;
        }

        return takerGot;
    }

    get TakerPaid(): AmountType {
        const affectedNodes = get(this, ['meta', 'AffectedNodes']);

        if (!affectedNodes) return this.TakerPays;

        const ledgerEntryType = this.TakerPays.currency === 'XRP' ? 'AccountRoot' : 'RippleState';
        const isIOU = this.TakerPays.currency !== 'XRP';

        let takerPaid: AmountType;

        affectedNodes.forEach((node: any) => {
            const { ModifiedNode } = node;

            if (!ModifiedNode || get(ModifiedNode, 'LedgerEntryType') !== ledgerEntryType || takerPaid) return;

            if (isIOU) {
                if (has(ModifiedNode.FinalFields, 'Balance') && has(ModifiedNode.PreviousFields, 'Balance')) {
                    const balance = new BigNumber(ModifiedNode.FinalFields.Balance.value);
                    const prevBalance = new BigNumber(ModifiedNode.PreviousFields.Balance.value);

                    takerPaid = {
                        currency: ModifiedNode.FinalFields.Balance.currency,
                        value: balance.minus(prevBalance).absoluteValue().decimalPlaces(6).toString(10),
                        issuer: ModifiedNode.FinalFields.Balance.issuer,
                    };
                }
            } else {
                // this will avoid calculating XRP the fee
                if (
                    get(ModifiedNode.FinalFields, 'Account') === this.Account.address &&
                    has(ModifiedNode.FinalFields, 'Balance') &&
                    has(ModifiedNode.PreviousFields, 'Balance')
                ) {
                    const balance = new BigNumber(ModifiedNode.FinalFields.Balance);
                    const prevBalance = new BigNumber(ModifiedNode.PreviousFields.Balance);

                    takerPaid = {
                        currency: 'XRP',
                        value: balance
                            .minus(prevBalance)
                            .absoluteValue()
                            .dividedBy(1000000.0)
                            .decimalPlaces(6)
                            .toString(10),
                    };
                }
            }
        });

        if (!takerPaid) {
            return this.TakerPays;
        }

        return takerPaid;
    }
}

/* Export ==================================================================== */
export default OfferCreate;
