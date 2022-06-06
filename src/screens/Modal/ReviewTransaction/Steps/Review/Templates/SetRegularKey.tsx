import isEmpty from 'lodash/isEmpty';
import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { SetRegularKey } from '@common/libs/ledger/transactions';
import { getAccountName, AccountNameType } from '@common/helpers/resolver';

import { RecipientElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    transaction: SetRegularKey;
}

export interface State {
    isLoading: boolean;
    regularKeyDetails: AccountNameType;
}

/* Component ==================================================================== */
class SetRegularKeyTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: false,
            regularKeyDetails: undefined,
        };
    }
    componentDidMount() {
        const { transaction } = this.props;

        if (!transaction.RegularKey) {
            return;
        }

        this.setState({
            isLoading: true,
        });

        getAccountName(transaction.RegularKey)
            .then((res: any) => {
                if (!isEmpty(res) && !res.error) {
                    this.setState({
                        regularKeyDetails: res,
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
        const { isLoading, regularKeyDetails } = this.state;
        return (
            <>
                <View style={styles.label}>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                        {Localize.t('global.regularKey')}
                    </Text>
                </View>

                {transaction.RegularKey ? (
                    <RecipientElement
                        containerStyle={[styles.contentBox, styles.addressContainer]}
                        isLoading={isLoading}
                        recipient={{
                            address: transaction.RegularKey,
                            ...regularKeyDetails,
                        }}
                    />
                ) : (
                    <View style={[styles.contentBox]}>
                        <Text style={[styles.value]}>{Localize.t('global.empty')}</Text>
                    </View>
                )}
            </>
        );
    }
}

export default SetRegularKeyTemplate;
