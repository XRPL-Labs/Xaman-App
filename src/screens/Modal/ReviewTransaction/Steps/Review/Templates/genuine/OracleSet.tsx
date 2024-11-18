import { isEmpty, isUndefined } from 'lodash';
import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { OracleSet } from '@common/libs/ledger/transactions';

import { FormatTimestamp } from '@common/utils/date';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: OracleSet;
}

export interface State {}

/* Component ==================================================================== */
class OracleSetTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    renderPriceDataSeries = () => {
        const { transaction } = this.props;

        if (isEmpty(transaction.PriceDataSeries)) {
            return (
                <View style={styles.contentBox}>
                    <Text style={styles.value}>{Localize.t('global.empty')}</Text>
                </View>
            );
        }

        return transaction.PriceDataSeries.map((priceData) => {
            return (
                <View key={`${priceData.BaseAsset}/${priceData.QuoteAsset}`} style={styles.contentBoxSecondary}>
                    <View style={AppStyles.row}>
                        <View style={AppStyles.flex1}>
                            <Text style={styles.label}>{Localize.t('global.baseAsset')}</Text>
                            <View style={styles.contentBox}>
                                <Text style={styles.value}>{priceData.BaseAsset}</Text>
                            </View>
                        </View>
                        <View style={AppStyles.flex1}>
                            <Text style={styles.label}>{Localize.t('global.quoteAsset')}</Text>
                            <View style={styles.contentBox}>
                                <Text style={styles.value}>{priceData.QuoteAsset}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={AppStyles.row}>
                        {!isUndefined(priceData.AssetPrice) && (
                            <View style={AppStyles.flex1}>
                                <Text style={styles.label}>{Localize.t('global.assetPrice')}</Text>
                                <View style={styles.contentBox}>
                                    <Text style={styles.value}>{priceData.AssetPrice}</Text>
                                </View>
                            </View>
                        )}
                        {!isUndefined(priceData.Scale) && (
                            <View style={AppStyles.flex1}>
                                <Text style={styles.label}>{Localize.t('global.scale')}</Text>
                                <View style={styles.contentBox}>
                                    <Text style={styles.value}>{priceData.Scale}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            );
        });
    };

    render() {
        const { transaction } = this.props;

        return (
            <>
                {!isUndefined(transaction.OracleDocumentID) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.oracleDocumentID')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>
                                {transaction.OracleDocumentID ?? Localize.t('global.empty')}
                            </Text>
                        </View>
                    </>
                )}

                {!isUndefined(transaction.Provider) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.provider')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.Provider || Localize.t('global.empty')}</Text>
                        </View>
                    </>
                )}

                {!isUndefined(transaction.AssetClass) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.assetClass')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.AssetClass || Localize.t('global.empty')}</Text>
                        </View>
                    </>
                )}

                {!isUndefined(transaction.URI) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.uri')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.URI || Localize.t('global.empty')}</Text>
                        </View>
                    </>
                )}

                {!isUndefined(transaction.LastUpdateTime) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.lastUpdateTime')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{FormatTimestamp(transaction.LastUpdateTime)}</Text>
                        </View>
                    </>
                )}

                <View style={styles.label}>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                        {Localize.t('global.priceDataSeries')}
                    </Text>
                </View>
                {this.renderPriceDataSeries()}
            </>
        );
    }
}

export default OracleSetTemplate;
