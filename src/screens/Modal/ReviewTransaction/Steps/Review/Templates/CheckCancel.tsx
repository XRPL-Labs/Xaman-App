import { get } from 'lodash';
import React, { Component } from 'react';
import { View, Text, Alert, InteractionManager } from 'react-native';

import { LedgerService } from '@services';

import { CheckCancel, CheckCreate } from '@common/libs/ledger/transactions';

import { NormalizeCurrencyCode } from '@common/utils/amount';

import { AccountElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

import { TemplateProps } from './types';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: CheckCancel;
}

export interface State {
    checkObject: CheckCreate;
}

/* Component ==================================================================== */
class CheckCancelTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            checkObject: undefined,
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.fetchCheckDetails);
    }

    fetchCheckDetails = () => {
        const { transaction } = this.props;

        // assign actual check object to the CashCheck tx
        LedgerService.getLedgerEntry({ index: transaction.CheckID })
            .then((ledgerEntry: any) => {
                const checkEntry = get(ledgerEntry, 'node', undefined);
                if (checkEntry) {
                    const checkObject = new CheckCreate(checkEntry);

                    this.setState(
                        {
                            checkObject,
                        },
                        () => {
                            transaction.Check = checkEntry;
                        },
                    );
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
        const { checkObject } = this.state;

        return (
            <>
                <View style={styles.label}>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                        {Localize.t('global.to')}
                    </Text>
                </View>

                <AccountElement
                    address={checkObject?.Destination.address}
                    tag={checkObject?.Destination.tag}
                    containerStyle={[styles.contentBox, styles.addressContainer]}
                />

                {/* Check Amount */}
                <Text style={styles.label}>{Localize.t('global.checkAmount')}</Text>
                <View style={styles.contentBox}>
                    <Text style={styles.amountRed}>
                        {`${checkObject?.SendMax.value || 0} ${NormalizeCurrencyCode(checkObject?.SendMax.currency)}`}
                    </Text>
                </View>

                {transaction.CheckID && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.checkID')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.valueSubtext}>{transaction.CheckID}</Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default CheckCancelTemplate;
