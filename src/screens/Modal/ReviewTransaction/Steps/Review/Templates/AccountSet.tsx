import isUndefined from 'lodash/isUndefined';
import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { AccountSet } from '@common/libs/ledger/transactions';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
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

        return <Text style={[styles.value]}>{transaction.SetFlag}</Text>;
    };

    render() {
        const { transaction } = this.props;

        if (
            isUndefined(transaction.SetFlag) &&
            isUndefined(transaction.ClearFlag) &&
            isUndefined(transaction.Domain) &&
            isUndefined(transaction.EmailHash) &&
            isUndefined(transaction.MessageKey) &&
            isUndefined(transaction.TransferRate)
        ) {
            return (
                <View key="details" style={[AppStyles.flex1, AppStyles.centerContent]}>
                    <Text style={[AppStyles.h5, AppStyles.textCenterAligned]}>
                        {Localize.t('global.noInformationToShow')}
                    </Text>
                </View>
            );
        }

        return (
            <>
                {transaction.Domain !== undefined && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.domain')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text selectable style={[styles.valueSubtext]}>
                                {transaction.Domain || Localize.t('global.empty')}
                            </Text>
                        </View>
                    </>
                )}
                {transaction.EmailHash !== undefined && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.emailHash')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text selectable style={[styles.valueSubtext]}>
                                {transaction.EmailHash || Localize.t('global.empty')}
                            </Text>
                        </View>
                    </>
                )}
                {transaction.MessageKey !== undefined && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.messageKey')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text selectable style={[styles.valueSubtext]}>
                                {transaction.MessageKey || Localize.t('global.empty')}
                            </Text>
                        </View>
                    </>
                )}
                {transaction.MintAccount !== undefined && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.mintAccount')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text selectable style={[styles.valueSubtext]}>
                                {transaction.MintAccount || Localize.t('global.empty')}
                            </Text>
                        </View>
                    </>
                )}
                {transaction.TransferRate !== undefined && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.transferRate')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text selectable style={[styles.valueSubtext]}>
                                {transaction.TransferRate} %
                            </Text>
                        </View>
                    </>
                )}
                {transaction.TickSize !== undefined && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.tickSize')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text selectable style={[styles.valueSubtext]}>
                                {transaction.TickSize}
                            </Text>
                        </View>
                    </>
                )}
                {transaction.SetFlag && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.setFlag')}</Text>
                        <View style={[styles.contentBox]}>{this.renderSetFlag()}</View>
                    </>
                )}
                {transaction.ClearFlag && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.clearFlag')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text selectable style={[styles.valueSubtext]}>
                                {transaction.ClearFlag}
                            </Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default AccountSetTemplate;
