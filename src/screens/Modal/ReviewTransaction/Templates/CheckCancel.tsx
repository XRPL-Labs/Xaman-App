import { get, isEmpty } from 'lodash';
import React, { Component } from 'react';
import { View, TextInput, Text, Alert } from 'react-native';

import { LedgerService } from '@services';

import { CheckCancel, CheckCreate } from '@common/libs/ledger/transactions';

import { NormalizeCurrencyCode } from '@common/libs/utils';
import { getAccountName, AccountNameType } from '@common/helpers/resolver';

import { RecipientElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    transaction: CheckCancel;
}

export interface State {
    isLoading: boolean;
    sourceDetails: AccountNameType;
}

/* Component ==================================================================== */
class CheckCancelTemplate extends Component<Props, State> {
    amountInput: TextInput;

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: false,
            sourceDetails: { name: '', source: '' },
        };
    }

    componentDidMount() {
        // fetch the destination name e
        this.fetchCheckDetails();
    }

    fetchCheckDetails = () => {
        const { transaction } = this.props;

        this.setState({
            isLoading: true,
        });

        // assign actual check object to the CashCheck tx
        LedgerService.getLedgerEntry(transaction.CheckID)
            .then((res: any) => {
                const checkObject = get(res, 'node', undefined);

                if (checkObject) {
                    transaction.Check = new CheckCreate(checkObject);

                    // fetch destination details
                    getAccountName(transaction.Check.Account.address)
                        .then((r: any) => {
                            if (!isEmpty(res)) {
                                this.setState({
                                    sourceDetails: r,
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
                } else {
                    Alert.alert(Localize.t('global.error'), Localize.t('payload.checkObjectDoesNotExist'));
                }
            })
            .catch(() => {
                Alert.alert(Localize.t('global.error'), Localize.t('payload.unableToGetCheckObject'));
            });
    };

    render() {
        const { transaction } = this.props;
        const { isLoading, sourceDetails } = this.state;

        return (
            <>
                <View style={styles.label}>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGreyDark]}>
                        {Localize.t('global.from')}
                    </Text>
                </View>

                <RecipientElement
                    containerStyle={[styles.contentBox, styles.addressContainer]}
                    isLoading={isLoading}
                    showAvatar={false}
                    recipient={{
                        address: transaction.Check?.Account.address,
                        ...sourceDetails,
                    }}
                />

                {/* Check Amount */}
                <Text style={[styles.label]}>{Localize.t('global.checkAmount')}</Text>
                <View style={[styles.contentBox]}>
                    <Text style={[styles.amountRed]}>
                        {`${transaction.Check?.SendMax.value || 0} ${NormalizeCurrencyCode(
                            transaction.Check?.SendMax.currency,
                        )}`}
                    </Text>
                </View>

                {transaction.CheckID && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.checkID')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text style={styles.valueSubtext}>{transaction.CheckID}</Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default CheckCancelTemplate;
