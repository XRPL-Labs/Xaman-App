import isEmpty from 'lodash/isEmpty';
import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { EscrowCancel } from '@common/libs/ledger/transactions';
import { getAccountName, AccountNameType } from '@common/helpers/resolver';

import Localize from '@locale';

import { RecipientElement } from '@components/Modules';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    transaction: EscrowCancel;
}

export interface State {
    isLoading: boolean;
    ownerDetails: AccountNameType;
}

/* Component ==================================================================== */
class EscrowCancelTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            ownerDetails: {
                name: '',
                source: '',
            },
        };
    }
    componentDidMount() {
        const { transaction } = this.props;

        getAccountName(transaction.Owner)
            .then((res: any) => {
                if (!isEmpty(res) && !res.error) {
                    this.setState({
                        ownerDetails: res,
                    });
                }
            })
            .catch(() => {
                // ignore
            })
            .finally(() => {
                this.setState({
                    isLoading: false,
                });
            });
    }

    render() {
        const { transaction } = this.props;
        const { isLoading, ownerDetails } = this.state;
        return (
            <>
                <View style={styles.label}>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGreyDark]}>
                        {Localize.t('global.owner')}
                    </Text>
                </View>

                <RecipientElement
                    containerStyle={[styles.contentBox, styles.addressContainer]}
                    isLoading={isLoading}
                    showAvatar={false}
                    recipient={{
                        address: transaction.Owner,
                        ...ownerDetails,
                    }}
                />

                <Text style={[styles.label]}>{Localize.t('global.offerSequence')}</Text>
                <View style={[styles.contentBox]}>
                    <Text style={styles.value}>{transaction.OfferSequence}</Text>
                </View>
            </>
        );
    }
}

export default EscrowCancelTemplate;
