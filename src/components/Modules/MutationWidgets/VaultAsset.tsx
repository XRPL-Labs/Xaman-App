import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

import { AmountText } from '@components/General';
// Import directly to avoid dependency cycle
import { CurrencyElement } from '@components/Modules/CurrencyElement';

import Localize from '@locale';

import styles from './styles';

/* Types ==================================================================== */
import { Props } from './types';

/* Component ==================================================================== */
class VaultAssetWidget extends PureComponent<Props> {
    render() {
        const { item } = this.props;

        const txType = (item as any)?.TransactionType || (item as any)?.LedgerEntryType || '';

        // Only show for Vault-related items
        if (!txType.match(/^Vault/i)) {
            return null;
        }

        // Get the Asset from the item
        const asset = (item as any)?.Asset;

        if (!asset || !asset.currency) {
            return null;
        }

        // Get AssetsTotal and AssetsAvailable for Vault ledger objects
        const assetsTotal = (item as any)?.AssetsTotal;
        const assetsAvailable = (item as any)?.AssetsAvailable;
        const isLedgerObject = (item as any)?.LedgerEntryType === 'Vault';

        return (
            <>
                <View style={styles.detailContainer}>
                    <Text style={styles.detailsLabelText}>{Localize.t('vault.asset')}</Text>
                    <View style={styles.currencyElementContainer}>
                        <CurrencyElement
                            issuer={asset.issuer}
                            currency={asset.currency}
                        />
                    </View>
                </View>

                {isLedgerObject && assetsTotal && (
                    <View style={styles.detailContainer}>
                        <Text style={styles.detailsLabelText}>{Localize.t('vault.assetsTotal')}</Text>
                        <View style={styles.currencyElementContainer}>
                            <AmountText
                                value={assetsTotal.value}
                                currency={asset.currency}
                                style={styles.amountText}
                                immutable
                            />
                        </View>
                    </View>
                )}

                {isLedgerObject && assetsAvailable && (
                    <View style={styles.detailContainer}>
                        <Text style={styles.detailsLabelText}>{Localize.t('vault.assetsAvailable')}</Text>
                        <View style={styles.currencyElementContainer}>
                            <AmountText
                                value={assetsAvailable.value}
                                currency={asset.currency}
                                style={styles.amountText}
                                immutable
                            />
                        </View>
                    </View>
                )}
            </>
        );
    }
}

export default VaultAssetWidget;
