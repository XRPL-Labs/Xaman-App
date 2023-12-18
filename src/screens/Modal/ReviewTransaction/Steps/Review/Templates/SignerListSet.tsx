import { isEmpty } from 'lodash';
import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { SignerListSet } from '@common/libs/ledger/transactions';

import { AccountElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

import { TemplateProps } from './types';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: SignerListSet;
}

export interface State {}

/* Component ==================================================================== */
class SignerListSetTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    renderSigners = () => {
        const { transaction } = this.props;

        if (isEmpty(transaction.SignerEntries)) {
            return (
                <View style={styles.contentBox}>
                    <Text style={styles.value}>{Localize.t('global.empty')}</Text>
                </View>
            );
        }

        return transaction.SignerEntries.map((signer) => {
            return (
                <View key={signer.account}>
                    <AccountElement address={signer.account} containerStyle={styles.signerEntryAccountElement} />
                    <View style={styles.signerEntryDetailsContainer}>
                        <Text style={[AppStyles.monoSubText, AppStyles.colorGrey]}>
                            {Localize.t('global.weight')}: <Text style={AppStyles.colorBlue}>{signer.weight}</Text>
                        </Text>
                        {signer.walletLocator && (
                            <Text style={[AppStyles.monoSubText, AppStyles.colorGrey]}>
                                {Localize.t('global.walletLocator')}:{' '}
                                <Text style={AppStyles.colorBlue}>{signer.walletLocator}</Text>
                            </Text>
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
                <View style={styles.label}>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                        {Localize.t('global.signerEntries')}
                    </Text>
                </View>

                {this.renderSigners()}

                <Text style={styles.label}>{Localize.t('global.signerQuorum')}</Text>
                <View style={styles.contentBox}>
                    <Text style={styles.value}>{transaction.SignerQuorum}</Text>
                </View>
            </>
        );
    }
}

export default SignerListSetTemplate;
