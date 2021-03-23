import { isEmpty } from 'lodash';

import React, { Component } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

import { SignerListSet } from '@common/libs/ledger/transactions';

import { getAccountName } from '@common/helpers/resolver';

import { Spacer } from '@components/General';

import Localize from '@locale';

import { AppStyles, AppColors } from '@theme';
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
        this.fetchSignersDetails();
    }

    fetchSignersDetails = async () => {
        const { transaction } = this.props;

        const signers = [] as any;

        await Promise.all(
            transaction.SignerEntries.map(async (e) => {
                const signer = e;
                // fetch destination details
                await getAccountName(e.account)
                    .then((res: any) => {
                        if (!isEmpty(res)) {
                            signers.push(Object.assign(signer, res));
                        }
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

    render() {
        const { transaction } = this.props;
        const { signers, isLoading } = this.state;

        return (
            <>
                <View style={styles.label}>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                        {Localize.t('global.signerEntries')}
                    </Text>
                </View>

                {isLoading ? (
                    <ActivityIndicator color={AppColors.blue} />
                ) : (
                    signers.map((e) => {
                        return (
                            // eslint-disable-next-line react-native/no-inline-styles
                            <View style={[styles.contentBox, styles.addressContainer, { paddingLeft: 18 }]}>
                                {e.name && (
                                    <>
                                        <Text selectable style={styles.address}>
                                            {e.name}
                                        </Text>
                                        <Spacer size={5} />
                                    </>
                                )}
                                <Text selectable style={styles.address}>
                                    {e.account}
                                </Text>
                                <Spacer size={10} />
                                <View style={AppStyles.hr} />
                                <Spacer size={10} />
                                <Text style={styles.value}>
                                    {Localize.t('global.weight')}: {e.weight}
                                </Text>
                            </View>
                        );
                    })
                )}

                <Text style={[styles.label]}>{Localize.t('global.signerQuorum')}</Text>
                <View style={[styles.contentBox]}>
                    <Text style={styles.value}>{transaction.SignerQuorum}</Text>
                </View>
            </>
        );
    }
}

export default SignerListSetTemplate;
