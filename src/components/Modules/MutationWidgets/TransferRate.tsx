import BigNumber from 'bignumber.js';

import { parseBalanceChanges } from 'ripple-lib-transactionparser';

import React, { PureComponent } from 'react';
import { InteractionManager, Text, View } from 'react-native';

import { TransactionTypes } from '@common/libs/ledger/types/enums';

import Localize from '@locale';

import styles from './styles';
/* Types ==================================================================== */
import { Props } from './types';

interface BalanceChange {
  counterparty: string;
  currency: string;
  value: string;
}

interface CurrencyTallyMap {
  [key: string]: string; // Combined key (issuer.currency) to netChange value
}

interface State {
    transferRatePercentage?: string;
}

/* Component ==================================================================== */
class TransferRate extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            transferRatePercentage: undefined,
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.calculateTransferFee);
    }

    /**
     * Tallies all unique issued currencies from transaction metadata
     * Creates an object with combined issuer.currency keys and netChange values
     * 
     * @param metadata - The transaction metadata object
     * @returns Object with issuer.currency keys and netChange string values
     */
    tallyCurrencyChanges = (metadata: any): CurrencyTallyMap => {
        // Parse the balance changes
        const balanceChanges = parseBalanceChanges(metadata);
        
        // Create a map to track cumulative changes by issuer and currency
        const tallyMap: { [key: string]: BigNumber } = {};
        
        // Process all balance changes
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        Object.entries(balanceChanges).forEach(([address, changes]) => {
            changes.forEach((change: BalanceChange) => {
                // Skip XRP (native currency has empty counterparty)
                if (change.currency === 'XRP' && change.counterparty === '') {
                    return;
                }
                
                // For issued currencies, the counterparty is the issuer
                const issuer = change.counterparty;
                // eslint-disable-next-line prefer-destructuring
                const currency = change.currency;
                const key = `${issuer}.${currency}`;
                
                // Create or update tally
                if (!tallyMap[key]) {
                    tallyMap[key] = new BigNumber(0);
                }
                
                // Add the change to the running total
                tallyMap[key] = tallyMap[key].plus(new BigNumber(change.value));
            });
        });
        
        // Convert BigNumber values to strings
        const result: CurrencyTallyMap = {};
        Object.entries(tallyMap).forEach(([key, value]) => {
            result[key] = value.toString();
        });
        
        return result;
    };

    calculateTransferFee = () => {
        const { item, account } = this.props;

        // only for payments for now
        if (item.Type !== TransactionTypes.Payment) {
            return null;
        }

        const involvedIssuers = [ ...new Set([
            typeof item?.Amount !== 'string' && item?.Amount ? item?.Amount?.issuer : null,
            typeof item?.DeliveredAmount !== 'string' && item?.DeliveredAmount ? item?.DeliveredAmount?.issuer : null,
            typeof item?.SendMax !== 'string' && item?.SendMax ? item?.SendMax?.issuer : null,
        ].filter(i => i))];

        const involvedAssets = [ ...new Set([
            typeof item?.Amount !== 'string' && item?.Amount ? item?.Amount?.currency : null,
            typeof item?.DeliveredAmount !== 'string' && item?.DeliveredAmount ? item?.DeliveredAmount?.currency : null,
            typeof item?.SendMax !== 'string' && item?.SendMax ? item?.SendMax?.currency : null,
        ].filter(i => i))];

        // const balanceChanges = parseBalanceChanges(item.MetaData);
        const currencyTallies = this.tallyCurrencyChanges(item.MetaData);

        const changesPerAsset = involvedAssets.map(currency => {
            const issuerChange = involvedIssuers.map(i => {
                return currencyTallies?.[`${i}.${currency}`];
            }).filter(i => !!i)?.[0] || String(0);

            const ownChange = currencyTallies?.[`${account.address}.${currency}`] || String(0);

            return {
                currency,
                issuerChange,
                ownChange,
                percentageToIssuer: (new BigNumber(issuerChange).isLessThan(0) && !new BigNumber(ownChange).isZero())
                    ? new BigNumber(issuerChange)
                        .abs()
                        .dividedBy(new BigNumber(ownChange).abs())
                        .multipliedBy(100)
                        .toFixed(2)
                        .replace(/\.?0+$/, '')
                    : undefined,
            };
        })
        .sort((a, b) => {
            // Convert percentages to numbers for comparison
            const percentA = new BigNumber(a.percentageToIssuer || 0);
            const percentB = new BigNumber(b.percentageToIssuer || 0);
            
            // Sort in descending order (highest percentage first)
            return percentB.minus(percentA).toNumber();
        });

        const transferRatePercentage = changesPerAsset?.[0]?.percentageToIssuer;

        if (transferRatePercentage) {
            this.setState({ transferRatePercentage });
        }

        return transferRatePercentage;
    };

    render() {
        const { transferRatePercentage } = this.state;

        if (!transferRatePercentage) {
            return null;
        }

        return (
            <View style={styles.detailContainer}>
                <Text style={styles.detailsLabelText}>{Localize.t('global.transferFee')}</Text>
                <Text style={styles.detailsValueText}>
                    {Localize.t('events.transferRateMayApplied', {
                        transferRatePercentage: `${transferRatePercentage}%`,
                    })}
                </Text>
            </View>
        );
    }
}

export default TransferRate;