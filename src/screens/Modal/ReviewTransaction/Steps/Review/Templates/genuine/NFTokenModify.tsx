import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { NFTokenModify } from '@common/libs/ledger/transactions';

import { AccountElement, NFTokenElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: NFTokenModify;
}

export interface State {}

/* Component ==================================================================== */
class NFTokenModifyTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction, source } = this.props;

        return (
            <>
                {transaction.Owner && (
                    <>
                        <View style={styles.label}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                {Localize.t('global.owner')}
                            </Text>
                        </View>
                        <AccountElement
                            address={transaction.Owner}
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                        />
                    </>
                )}

                {transaction?.NFTokenID && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.nft')}</Text>
                        <View style={styles.contentBox}>
                            <NFTokenElement
                                account={source.address}
                                nfTokenId={transaction.NFTokenID}
                                truncate={false}
                                containerStyle={styles.nfTokenContainer}
                            />
                        </View>
                    </>
                )}

                {/* <Text>{JSON.stringify(transaction, null, 2)}</Text> */}

                {transaction.URI && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.uri')}</Text>
                        <View style={styles.contentBox}>
                            <Text selectable style={styles.value}>
                                {transaction.URI}
                            </Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default NFTokenModifyTemplate;
