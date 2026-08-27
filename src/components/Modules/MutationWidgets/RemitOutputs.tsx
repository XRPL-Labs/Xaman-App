import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

import Localize from '@locale';

import { AppScreens } from '@common/constants';
import { Navigator } from '@common/helpers/navigator';
import { buildRemitOutputTransactions } from '@common/libs/ledger/utils/remitOutputs';
import { Remit } from '@common/libs/ledger/transactions';
import { Transactions } from '@common/libs/ledger/transactions/types';
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';

import styles from './styles';

import { Props } from './types';

interface State {
    outputs: Array<Transactions & MutationsMixinType>;
}

class RemitOutputs extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { outputs: [] };
    }

    componentDidMount() {
        this.loadOutputs();
    }

    componentDidUpdate(prevProps: Props) {
        if (prevProps.item !== this.props.item) {
            this.loadOutputs();
        }
    }

    loadOutputs = () => {
        const { item } = this.props;
        if ((item as any)?.Type !== 'Remit' && (item as any)?.TransactionType !== 'Remit') {
            this.setState({ outputs: [] });
            return;
        }
        this.setState({ outputs: buildRemitOutputTransactions(item as Remit) });
    };

    onPress = (transaction: Transactions & MutationsMixinType) => {
        const { account } = this.props;
        Navigator.dismissModal().catch(() => {});
        setTimeout(() => {
            Navigator.showModal(AppScreens.Transaction.Details, {
                item: transaction,
                account,
            });
        }, 75);
    };

    render() {
        const { account, TransactionComponent } = this.props;
        const { outputs } = this.state;

        if (!TransactionComponent || outputs.length === 0) {
            return null;
        }

        return (
            <View style={styles.detailContainer}>
                <Text style={styles.detailsLabelText}>
                    {Localize.t('events.remitOutputs')} ({outputs.length})
                </Text>
                {outputs.map((transaction, index) => (
                    <View key={`remit-out-${transaction.hash || index}`}>
                        <TransactionComponent
                            showDespiteThirdParty
                            onPress={() => this.onPress(transaction)}
                            item={transaction}
                            account={account}
                            timestamp={0}
                        />
                    </View>
                ))}
            </View>
        );
    }
}

export default RemitOutputs;
