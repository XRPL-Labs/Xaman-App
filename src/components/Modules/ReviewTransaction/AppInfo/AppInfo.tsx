import React, { Component } from 'react';
import { Text, View } from 'react-native';

import { Payload } from '@common/libs/payload';

import { InstanceTypes, PseudoTransactionTypes } from '@common/libs/ledger/types/enums';
import { SignableMutatedTransaction } from '@common/libs/ledger/transactions/types';

import { ExplainerFactory } from '@common/libs/ledger/factory';
import { AccountModel } from '@store/models';

import { Avatar, Icon } from '@components/General';

import Localize from '@locale';

import styles from './styles';

/* Types ==================================================================== */
interface Props {
    source: AccountModel;
    transaction: SignableMutatedTransaction;
    payload: Payload;
}

interface State {
    transactionLabel?: string;
    appIconUrl?: string;
    appName?: string;
    customInstruction?: string;
}

/* Component ==================================================================== */
class AppInfo extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            transactionLabel: undefined,
            appIconUrl: undefined,
            appName: undefined,
            customInstruction: undefined,
        };
    }

    static getDerivedStateFromProps(nextProps: Props): Partial<State> | null {
        return {
            transactionLabel: ExplainerFactory.fromInstance(nextProps.transaction, nextProps.source)?.getEventsLabel(),
            appIconUrl: nextProps.payload.getApplicationIcon(),
            appName: nextProps.payload.getApplicationName(),
            customInstruction: nextProps.payload.getCustomInstruction(),
        };
    }

    renderAppIcon = () => {
        const { appIconUrl } = this.state;

        return <Avatar size={60} border source={{ uri: appIconUrl }} />;
    };

    renderAppName = () => {
        const { appName } = this.state;

        return <Text style={styles.appTitle}>{appName}</Text>;
    };

    renderCustomInstruction = () => {
        const { customInstruction } = this.state;

        if (customInstruction) {
            return (
                <>
                    <Text style={styles.descriptionLabel}>{Localize.t('global.details')}</Text>
                    <Text style={styles.instructionText}>{customInstruction}</Text>
                </>
            );
        }

        return null;
    };

    renderTransactionLabel = () => {
        const { transaction } = this.props;
        const { transactionLabel } = this.state;

        // hide type for sign in transaction
        if (transaction.Type === PseudoTransactionTypes.SignIn) {
            return null;
        }

        return (
            <>
                <Text style={styles.descriptionLabel}>{Localize.t('global.type')}</Text>
                <View style={[styles.transactionTypeContainer]}>
                    <Text style={styles.transactionTypeLabel}>{transactionLabel}</Text>
                    {transaction.InstanceType === InstanceTypes.FallbackTransaction ? (
                        <Icon name="IconFlaskConical" size={15} style={styles.fallbackIcon} />
                    ) : null}
                </View>
            </>
        );
    };

    render() {
        return (
            <View style={styles.container}>
                {this.renderAppIcon()}
                {this.renderAppName()}
                {this.renderCustomInstruction()}
                {this.renderTransactionLabel()}
            </View>
        );
    }
}

export default AppInfo;
