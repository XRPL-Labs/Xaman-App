import isEmpty from 'lodash/isEmpty';
import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { EscrowCancel } from '@common/libs/ledger/transactions';
import { getAccountName } from '@common/helpers/resolver';

import Localize from '@locale';

import styles from './styles';

/* types ==================================================================== */
export interface Props {
    transaction: EscrowCancel;
}

export interface State {
    isLoading: boolean;
    ownerName: string;
}

/* Component ==================================================================== */
class EscrowCancelTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: false,
            ownerName: '',
        };
    }
    componentDidMount() {
        const { transaction } = this.props;

        this.setState({
            isLoading: true,
        });

        getAccountName(transaction.Owner)
            .then((res: any) => {
                if (!isEmpty(res) && !res.error) {
                    this.setState({
                        ownerName: res.name,
                    });
                }
            })
            .finally(() => {
                this.setState({
                    isLoading: false,
                });
            });
    }

    render() {
        const { transaction } = this.props;
        const { isLoading, ownerName } = this.state;
        return (
            <>
                <Text style={[styles.label]}>
                    {Localize.t('global.owner')}:
                    {isLoading ? (
                        'Loading ...'
                    ) : (
                        <Text style={styles.value}> {ownerName || Localize.t('global.noNameFound')} </Text>
                    )}
                </Text>
                <View style={[styles.contentBox]}>
                    <Text style={[styles.address]}>{transaction.Owner}</Text>
                </View>

                <Text style={[styles.label]}>{Localize.t('global.offerSequence')}</Text>
                <View style={[styles.contentBox]}>
                    <Text style={styles.value}>{transaction.OfferSequence}</Text>
                </View>
            </>
        );
    }
}

export default EscrowCancelTemplate;
