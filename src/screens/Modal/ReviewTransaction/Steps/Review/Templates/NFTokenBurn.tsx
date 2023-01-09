/* eslint-disable react/jsx-one-expression-per-line */

import { isEmpty } from 'lodash';

import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { getAccountName, AccountNameType } from '@common/helpers/resolver';

import { NFTokenBurn } from '@common/libs/ledger/transactions';

import Localize from '@locale';

import { RecipientElement } from '@components/Modules';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    transaction: NFTokenBurn;
}

export interface State {
    isLoading: boolean;
    ownerDetails: AccountNameType;
}

/* Component ==================================================================== */
class NFTokenBurnTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            ownerDetails: undefined,
        };
    }

    componentDidMount() {
        const { transaction } = this.props;

        if (!transaction.Owner) {
            return;
        }

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
                <Text style={[styles.label]}>{Localize.t('global.tokenID')}</Text>
                <View style={[styles.contentBox]}>
                    <Text style={[styles.value]}>{transaction.NFTokenID}</Text>
                </View>

                {transaction.Owner && (
                    <>
                        <View style={styles.label}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                {Localize.t('global.owner')}
                            </Text>
                        </View>
                        <RecipientElement
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                            isLoading={isLoading}
                            recipient={{
                                address: transaction.Owner,
                                ...ownerDetails,
                            }}
                        />
                    </>
                )}
            </>
        );
    }
}

export default NFTokenBurnTemplate;
