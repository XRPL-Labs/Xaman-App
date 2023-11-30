import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { NFTokenBurn } from '@common/libs/ledger/transactions';

import { AccountElement, NFTokenElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

import { TemplateProps } from './types';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: NFTokenBurn;
}

export interface State {}

/* Component ==================================================================== */
class NFTokenBurnTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction, source } = this.props;

        return (
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
            </>
        );
    }
}

export default NFTokenBurnTemplate;
