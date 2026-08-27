import { isEmpty } from 'lodash';

import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { PermissionedDomainSet } from '@common/libs/ledger/transactions';

import { AccountElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';
import { HexEncoding } from '@common/utils/string';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: PermissionedDomainSet;
}

export interface State {}

/* Component ==================================================================== */
class PermissionedDomainSetTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    renderAcceptedCredentials = () => {
        const { transaction } = this.props;

        if (isEmpty(transaction.AcceptedCredentials)) {
            return (
                <View style={styles.contentBox}>
                    <Text style={styles.value}>{Localize.t('global.empty')}</Text>
                </View>
            );
        }

        return transaction.AcceptedCredentials.map((credential) => {
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
            <View>
                {transaction.DomainID && (
                    <>
                        <Text style={styles.label}>{Localize.t('permissionedDomain.domainId')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.DomainID}</Text>
                        </View>
                    </>
                )}
                {transaction.AcceptedCredentials && (
                    <>
                        <View style={styles.label}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                {Localize.t('permissionedDomain.acceptedCredentials')}
                            </Text>
                        </View>
                        {this.renderAcceptedCredentials()}
                    </>
                )}
                {((!transaction?.AcceptedCredentials) || transaction.AcceptedCredentials.length === 0) && (
                    <>
                        <View style={styles.label}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                {Localize.t('permissionedDomain.acceptedCredentials')}
                            </Text>
                        </View>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{Localize.t('global.none')}</Text>
                        </View>
                    </>
                )}
            </View>
        );
    }
}

export default PermissionedDomainSetTemplate;
