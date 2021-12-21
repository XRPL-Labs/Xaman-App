import { isEmpty } from 'lodash';
import React, { Component } from 'react';
import { View, Text, InteractionManager } from 'react-native';

import { SignerListSet } from '@common/libs/ledger/transactions';

import { getAccountName } from '@common/helpers/resolver';

import { LoadingIndicator } from '@components/General';
import { RecipientElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    transaction: SignerListSet;
}

export interface State {
    signers: Array<any>;
    isLoading: boolean;
}

/* Component ==================================================================== */
class SignerListSetTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            signers: [],
            isLoading: true,
        };
    }

    componentDidMount() {
        // fetch the signers details
        InteractionManager.runAfterInteractions(this.fetchSignersDetails);
    }

    fetchSignersDetails = async () => {
        const { transaction } = this.props;

        if (isEmpty(transaction.SignerEntries)) {
            this.setState({
                isLoading: false,
            });
            return;
        }

        const signers = [] as any;

        await Promise.all(
            transaction.SignerEntries.map(async (signer) => {
                await getAccountName(signer.account)
                    .then((res: any) => {
                        signers.push(Object.assign(signer, res));
                    })
                    .catch(() => {
                        signers.push(signer);
                    });

                return signer;
            }),
        );

        this.setState({
            signers,
            isLoading: false,
        });
    };

    renderSigners = () => {
        const { transaction } = this.props;
        const { signers, isLoading } = this.state;

        if (isEmpty(transaction.SignerEntries)) {
            return (
                <View style={[styles.contentBox]}>
                    <Text style={styles.value}>{Localize.t('global.empty')}</Text>
                </View>
            );
        }

        if (isLoading) {
            return <LoadingIndicator />;
        }

        return signers.map((signer) => {
            return (
                <RecipientElement
                    key={signer.account}
                    recipient={signer}
                    extraInfoLabel={Localize.t('global.weight')}
                    extraInfoValue={signer.weight}
                />
            );
        });
    };

    render() {
        const { transaction } = this.props;

        return (
            <>
                <View style={styles.label}>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                        {Localize.t('global.signerEntries')}
                    </Text>
                </View>

                {this.renderSigners()}

                <Text style={[styles.label]}>{Localize.t('global.signerQuorum')}</Text>
                <View style={[styles.contentBox]}>
                    <Text style={styles.value}>{transaction.SignerQuorum || 'NOT PRESENT'}</Text>
                </View>
            </>
        );
    }
}

export default SignerListSetTemplate;
