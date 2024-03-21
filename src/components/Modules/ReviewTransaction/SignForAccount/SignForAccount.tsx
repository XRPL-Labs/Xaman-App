import React, { Component } from 'react';
import { Text, View } from 'react-native';

import { SignableMutatedTransaction } from '@common/libs/ledger/transactions/types';
import { AccountModel } from '@store/models';

import { AccountElement } from '@components/Modules/AccountElement';

import Localize from '@locale';

import styles from './styles';

/* Types ==================================================================== */
interface Props {
    transaction: SignableMutatedTransaction;
    source: AccountModel;
}

interface State {}
/* Component ==================================================================== */
class SignerLabel extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction, source } = this.props;

        if (transaction.Account && source.address === transaction.Account) {
            return null;
        }

        return (
            <View style={styles.container}>
                <Text style={styles.label}>{Localize.t('global.signFor')}</Text>
                <AccountElement address={transaction.Account} />
            </View>
        );
    }
}

export default SignerLabel;
