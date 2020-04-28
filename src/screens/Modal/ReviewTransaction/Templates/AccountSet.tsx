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

        if (!transaction.SetFlag && !transaction.ClearFlag && transaction.Domain === undefined) {
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
                {transaction.EmailHash && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.emailHash')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text selectable style={[styles.valueSubtext]}>
                                {transaction.EmailHash}
                            </Text>
                        </View>
                    </>
                )}
                {transaction.MessageKey && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.messageKey')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text selectable style={[styles.valueSubtext]}>
                                {transaction.MessageKey}
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
