import { isEmpty, isUndefined } from 'lodash';

import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { Remit } from '@common/libs/ledger/transactions';

import { Clipboard } from '@common/helpers/clipboard';
import { Toast } from '@common/helpers/interface';

import { AmountText, Icon, ReadMore, TouchableDebounce } from '@components/General';
import { AccountElement } from '@components/Modules';

import Localize from '@locale';

import styles from '../styles';

import { TemplateProps } from '../types';
import { AppStyles } from '@theme';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: Remit;
}

export interface State {}

/* Component ==================================================================== */
class RemitTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    renderAmounts = () => {
        const { transaction } = this.props;

        if (isEmpty(transaction.Amounts)) {
            return <Text style={styles.value}>{Localize.t('global.empty')}</Text>;
        }

        return transaction.Amounts.map((amount) => {
            return (
                <View key={`${amount.currency}-${amount.value}`}>
                    <AmountText value={amount.value} currency={amount.currency} style={styles.amount} immutable />
                </View>
            );
        });
    };

    renderURITokenIDs = () => {
        const { transaction } = this.props;

        if (isEmpty(transaction.URITokenIDs)) {
            return <Text style={styles.value}>{Localize.t('global.empty')}</Text>;
        }

        return transaction.URITokenIDs?.map((id) => {
            return (
                <Text key={`${id}`} style={styles.value}>
                    {id}
                </Text>
            );
        });
    };

    copyBlob = () => {
        const { transaction } = this.props;

        Clipboard.setString(transaction.Blob);
        Toast(Localize.t('payload.blobCopiedToClipboard'));
    };

    render() {
        const { transaction } = this.props;

        return (
            <>
                {!isUndefined(transaction.Destination) && (
                    <>
                        <View style={styles.label}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                {Localize.t('global.destination')}
                            </Text>
                        </View>

                        <AccountElement
                            address={transaction.Destination}
                            tag={transaction.DestinationTag}
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                        />
                    </>
                )}

                {!isUndefined(transaction.Amounts) && (
                    <>
                        <Text style={styles.label}>{Localize.t('events.amounts')}</Text>
                        <View style={styles.contentBox}>{this.renderAmounts()}</View>
                    </>
                )}

                {!isUndefined(transaction.URITokenIDs) && (
                    <>
                        <Text style={styles.label}>{Localize.t('events.uriTokenIDs')}</Text>
                        <View style={styles.contentBox}>{this.renderURITokenIDs()}</View>
                    </>
                )}

                {!isUndefined(transaction.MintURIToken) && (
                    <>
                        <Text style={styles.label}>{Localize.t('events.mintURIToken')}</Text>
                        <View style={[styles.contentBoxSecondary]}>
                            {!isUndefined(transaction.MintURIToken.URI) && (
                                <>
                                    <Text style={styles.label}>{Localize.t('global.uri')}</Text>
                                    <View style={styles.contentBox}>
                                        <Text style={styles.value}>{transaction.MintURIToken.URI}</Text>
                                    </View>
                                </>
                            )}

                            {!isUndefined(transaction.MintURIToken.Digest) && (
                                <>
                                    <Text style={styles.label}>{Localize.t('global.digest')}</Text>
                                    <View style={styles.contentBox}>
                                        <Text style={styles.valueSubtext}>{transaction.MintURIToken.Digest}</Text>
                                    </View>
                                </>
                            )}

                            {!isUndefined(transaction.MintURIToken.Flags) && (
                                <>
                                    <Text style={styles.label}>{Localize.t('global.flags')}</Text>
                                    <View style={styles.contentBox}>
                                        <Text style={styles.valueSubtext}>{transaction.MintURIToken.Flags}</Text>
                                    </View>
                                </>
                            )}
                        </View>
                    </>
                )}

                {!isUndefined(transaction.Blob) && (
                    <>
                        <View style={AppStyles.row}>
                            <Text style={styles.label}>{Localize.t('global.blob')}</Text>
                            <View style={[AppStyles.flex1, AppStyles.rightAligned]}>
                                <TouchableDebounce style={styles.copyButton} onPress={this.copyBlob}>
                                    <Text style={styles.copyText}>{Localize.t('global.copy')}</Text>
                                    <Icon size={18} name="IconClipboard" style={AppStyles.imgColorGrey} />
                                </TouchableDebounce>
                            </View>
                        </View>
                        <View style={styles.contentBox}>
                            <ReadMore numberOfLines={3} textStyle={styles.value}>
                                {transaction.Blob}
                            </ReadMore>
                        </View>
                    </>
                )}

                {!isUndefined(transaction.Inform) && (
                    <>
                        <View style={styles.label}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                {Localize.t('global.inform')}
                            </Text>
                        </View>
                        <AccountElement
                            address={transaction.Inform}
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                        />
                    </>
                )}

                {!isUndefined(transaction.InvoiceID) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.invoiceID')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.InvoiceID}</Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default RemitTemplate;
