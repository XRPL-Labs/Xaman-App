import { isEmpty } from 'lodash';

import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { DepositPreauth } from '@common/libs/ledger/transactions';

import { AccountElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';
import { HexEncoding } from '@common/utils/string';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: DepositPreauth;
}

export interface State {}

/* Component ==================================================================== */
class DepositPreauthTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    renderAuthorizeCredentials = () => {
        const { transaction } = this.props;

        if (isEmpty(transaction.AuthorizeCredentials)) {
            return (
                <View style={styles.contentBox}>
                    <Text style={styles.value}>{Localize.t('global.empty')}</Text>
                </View>
            );
        }

        return transaction.AuthorizeCredentials.map((credential) => {
            return (
                <View style={[
                    styles.credentialContainer,
                ]} key={credential.Issuer}>
                    <AccountElement address={credential.Issuer} containerStyle={styles.attachedAccountElement} />
                    <View style={styles.authorizeCredentialsContainer}>
                        <Text style={[AppStyles.monoSubText, AppStyles.colorGrey]}>
                            {Localize.t('global.credentialType')}:{' '}
                            <Text style={AppStyles.colorBlue}>{
                                HexEncoding.displayHex(String(credential.CredentialType))
                            }</Text>
                        </Text>
                    </View>
                </View>
            );
        });
    };

    renderUnauthorizeCredentials = () => {
        const { transaction } = this.props;

        if (isEmpty(transaction.UnauthorizeCredentials)) {
            return (
                <View style={styles.contentBox}>
                    <Text style={styles.value}>{Localize.t('global.empty')}</Text>
                </View>
            );
        }

        return transaction.UnauthorizeCredentials.map((credential) => {
            return (
                <View style={[
                    styles.credentialContainer,
                ]} key={credential.Issuer}>
                    <AccountElement address={credential.Issuer} containerStyle={styles.attachedAccountElement} />
                    <View style={styles.authorizeCredentialsContainer}>
                        <Text style={[AppStyles.monoSubText, AppStyles.colorGrey]}>
                            {Localize.t('global.credentialType')}:{' '}
                            <Text style={AppStyles.colorBlue}>{
                                HexEncoding.displayHex(String(credential.CredentialType))
                            }</Text>
                        </Text>
                    </View>
                </View>
            );
        });
    };

    render() {
        const { transaction } = this.props;

        return (
            <>
                {transaction.Authorize && (
                    <>
                        <View style={styles.label}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                {Localize.t('global.authorize')}
                            </Text>
                        </View>

                        <AccountElement
                            address={transaction.Authorize}
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                        />
                    </>
                )}

                {transaction.Unauthorize && (
                    <>
                        <View style={styles.label}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                {Localize.t('global.unauthorize')}
                            </Text>
                        </View>

                        <AccountElement
                            address={transaction.Unauthorize}
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                        />
                    </>
                )}

                {transaction.AuthorizeCredentials && (
                    <>
                        <View style={styles.label}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                {Localize.t('global.authorizeCredentials')}
                            </Text>
                        </View>
                        {this.renderAuthorizeCredentials()}
                    </>
                )}

                {transaction.UnauthorizeCredentials && (
                    <>
                        <View style={styles.label}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                {Localize.t('global.unauthorizeCredentials')}
                            </Text>
                        </View>
                        {this.renderUnauthorizeCredentials()}
                    </>
                )}
            </>
        );
    }
}

export default DepositPreauthTemplate;
