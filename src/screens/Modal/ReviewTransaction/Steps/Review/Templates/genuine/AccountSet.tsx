import isUndefined from 'lodash/isUndefined';
import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { InfoMessage } from '@components/General';

import { AccountSet } from '@common/libs/ledger/transactions';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: AccountSet;
}
export interface State {}

/* Component ==================================================================== */
class AccountSetTemplate extends Component<Props, State> {
    renderSetFlag = () => {
        const { transaction } = this.props;

        if (transaction.SetFlag === 'asfDisableMaster') {
            return <Text style={[styles.value, AppStyles.colorRed]}>{transaction.SetFlag}</Text>;
        }

        return <Text style={styles.value}>{transaction.SetFlag}</Text>;
    };

    renderClearFlag = () => {
        const { transaction } = this.props;

        return <Text style={styles.value}>{transaction.ClearFlag}</Text>;
    };

    renderNoOperation = () => {
        const { transaction } = this.props;

        let message = Localize.t('events.thisTransactionDoesNotEffectAnyAccountSettings');

        // cancel ticket
        if (transaction.isCancelTicket()) {
            message = Localize.t('events.thisTransactionClearTicket', {
                ticketSequence: transaction.TicketSequence,
            });
        }

        return (
            <View style={styles.signersContainer}>
                <InfoMessage type="info" label={message} />
            </View>
        );
    };

    render() {
        const { transaction } = this.props;

        // this is a no-op transaction
        if (transaction.isNoOperation()) {
            return this.renderNoOperation();
        }

        return (
            <>
                {!isUndefined(transaction.Domain) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.domain')}</Text>
                        <View style={styles.contentBox}>
                            <Text selectable style={styles.valueSubtext}>
                                {transaction.Domain || Localize.t('global.empty')}
                            </Text>
                        </View>
                    </>
                )}
                {!isUndefined(transaction.EmailHash) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.emailHash')}</Text>
                        <View style={styles.contentBox}>
                            <Text selectable style={styles.valueSubtext}>
                                {transaction.EmailHash || Localize.t('global.empty')}
                            </Text>
                        </View>
                    </>
                )}
                {!isUndefined(transaction.MessageKey) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.messageKey')}</Text>
                        <View style={styles.contentBox}>
                            <Text selectable style={styles.valueSubtext}>
                                {transaction.MessageKey || Localize.t('global.empty')}
                            </Text>
                        </View>
                    </>
                )}
                {!isUndefined(transaction.NFTokenMinter) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.mintAccount')}</Text>
                        <View style={styles.contentBox}>
                            <Text selectable style={styles.valueSubtext}>
                                {transaction.NFTokenMinter || Localize.t('global.empty')}
                            </Text>
                        </View>
                    </>
                )}
                {!isUndefined(transaction.TransferRate) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.transferRate')}</Text>
                        <View style={styles.contentBox}>
                            <Text selectable style={styles.valueSubtext}>
                                {transaction.TransferRate} %
                            </Text>
                        </View>
                    </>
                )}
                {!isUndefined(transaction.TickSize) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.tickSize')}</Text>
                        <View style={styles.contentBox}>
                            <Text selectable style={styles.valueSubtext}>
                                {transaction.TickSize}
                            </Text>
                        </View>
                    </>
                )}

                {!isUndefined(transaction.SetFlag) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.setFlag')}</Text>
                        <View style={styles.contentBox}>{this.renderSetFlag()}</View>
                    </>
                )}

                {!isUndefined(transaction.ClearFlag) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.clearFlag')}</Text>
                        <View style={styles.contentBox}>{this.renderClearFlag()}</View>
                    </>
                )}
            </>
        );
    }
}

export default AccountSetTemplate;
