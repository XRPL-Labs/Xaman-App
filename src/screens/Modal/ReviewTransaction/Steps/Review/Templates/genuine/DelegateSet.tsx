import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { DelegateSet } from '@common/libs/ledger/transactions';

import { AccountElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';
import { InfoMessage } from '@components/General';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: DelegateSet;
}

export interface State {}

/* Component ==================================================================== */
class DelegateSetTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction } = this.props;

        return (
            <>
                {
                    transaction.___dangerPerms.length > 0 && (
                        <View style={[
                        ]}>
                            <Text style={[
                                AppStyles.bold,
                                styles.label,
                                AppStyles.h5,
                                AppStyles.colorRed,
                                AppStyles.paddingBottomSml,
                            ]}>Dangerous permissions included!</Text>
                            <View style={[
                                styles.contentBox,
                            ]}>
                                <InfoMessage type="error" label={Localize.t('txDelegateSet.dangerousPerms', {
                                    perms: transaction.___dangerPerms.join(', '),
                                })} />
                            </View>
                        </View>
                    )
                }

                {(!Array.isArray(transaction?.Permissions) || (transaction?.Permissions?.length === 0)) && (
                    <View style={[
                        styles.label,
                    ]}>
                        <View> 
                            <InfoMessage
                                type="neutral"
                                label={Localize.t('txDelegateSet.itRemovesTheAccountAuthorize')}
                            />
                        </View>
                        {/* <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                            {Localize.t('txDelegateSet.deauthorize')}
                        </Text> */}
                    </View>
                )}

                {(Array.isArray(transaction?.Permissions) && (transaction.Permissions.length > 0)) && (
                    <View style={styles.label}>
                        <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                            {Localize.t('txDelegateSet.authorize')}
                        </Text>
                    </View>
                )}

                {transaction.Authorize ? (
                    <AccountElement
                        address={transaction.Authorize}
                        containerStyle={[styles.contentBox, styles.addressContainer]}
                    />
                ) : (
                    <View style={styles.contentBox}>
                        <Text style={styles.value}>{Localize.t('txDelegateSet.empty')}</Text>
                    </View>
                )}

                {transaction.Permissions && (
                    <>
                        <Text style={styles.label}>{Localize.t('txDelegateSet.permissionsGranted')}</Text>
                        <View style={styles.contentBox}>
                            {transaction.___translatedDelegations.map((permission, index) => {
                                return (
                                    <Text key={`permission-${index}`} style={[
                                        styles.value,
                                        transaction.___dangerPerms.indexOf(permission) > -1 && AppStyles.colorRed,
                                    ]}>
                                        {permission} {
                                            transaction.___dangerPerms.indexOf(permission) > -1 && '(!)'
                                        }
                                    </Text>
                                );
                            })}
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default DelegateSetTemplate;
