import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { SignerListSet } from '@common/libs/ledger/transactions';

import { Spacer } from '@components';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    transaction: SignerListSet;
}

export interface State {
    isLoading: boolean;
}

/* Component ==================================================================== */
class SignerListSetTemplate extends Component<Props, State> {
    render() {
        const { transaction } = this.props;

        return (
            <>
                <Text style={[styles.label]}>{Localize.t('global.signerQuorum')}:</Text>
                <View style={[styles.contentBox]}>
                    <Text style={styles.value}>{transaction.SignerQuorum}</Text>
                </View>

                <Text style={[styles.label]}>{Localize.t('global.signerEntries')}: </Text>
                <View style={[styles.contentBox]}>
                    {transaction.SignerEntries.map(e => {
                        return (
                            <>
                                <Spacer size={10} />
                                <Text selectable style={styles.address}>
                                    {e.account}
                                </Text>
                                <Spacer size={10} />
                                <Text style={styles.value}>
                                    {Localize.t('global.weight')}: {e.weight}
                                </Text>
                                <Spacer size={10} />
                                <View style={AppStyles.hr} />
                            </>
                        );
                    })}
                </View>
            </>
        );
    }
}

export default SignerListSetTemplate;
