import React, { Component } from 'react';

import { Text, View } from 'react-native';

import { AccountModel } from '@store/models';

import { Truncate } from '@common/utils/string';

import { AnimatedDialog, Button, RadioButton, Spacer } from '@components/General';

import Localize from '@locale';

import { AppStyles } from '@theme';

import styles from './styles';

import { MethodsContext } from '../Context';

/* types ==================================================================== */
export interface Props {}

export interface State {
    selectedSigner?: AccountModel;
}
/* Component ==================================================================== */
class SelectSigner extends Component<Props, State> {
    static contextType = MethodsContext;
    declare context: React.ContextType<typeof MethodsContext>;

    constructor(props: Props, context: React.ContextType<typeof MethodsContext>) {
        super(props);

        this.state = {
            selectedSigner: context.preferredSigner,
        };
    }

    onSignPress = () => {
        const { onPreferredSignerSelect } = this.context;
        const { selectedSigner } = this.state;

        if (!selectedSigner) {
            throw new Error('Signer is required!');
        }

        if (typeof onPreferredSignerSelect === 'function') {
            onPreferredSignerSelect(selectedSigner);
        }
    };

    onSignerSelect = (account: AccountModel) => {
        this.setState({
            selectedSigner: account,
        });
    };

    render() {
        const { signer, signerDelegate, dismiss } = this.context;
        const { selectedSigner } = this.state;

        return (
            <AnimatedDialog onStartShouldSetResponder={() => true} containerStyle={styles.container}>
                <View style={[AppStyles.row, AppStyles.centerAligned]}>
                    <View style={[AppStyles.flex1, AppStyles.paddingLeftSml, AppStyles.paddingRightSml]}>
                        <Text numberOfLines={1} style={[AppStyles.p, AppStyles.bold]}>
                            {Localize.t('global.signing')}
                        </Text>
                    </View>
                    <View style={[AppStyles.row, AppStyles.flex1, AppStyles.flexEnd]}>
                        <Button
                            light
                            numberOfLines={1}
                            label={Localize.t('global.cancel')}
                            roundedSmall
                            onPress={dismiss}
                        />
                    </View>
                </View>
                <View style={[AppStyles.row, AppStyles.paddingTopSml]}>
                    <View style={[AppStyles.container, AppStyles.centerContent]}>
                        <Text
                            style={[
                                AppStyles.subtext,
                                AppStyles.bold,
                                AppStyles.textCenterAligned,
                                AppStyles.paddingTopSml,
                            ]}
                        >
                            {Localize.t('account.thereAreAccountsEligibleToSign', { signersCount: 2 })}
                        </Text>

                        <Spacer size={40} />

                        {signer && (
                            <RadioButton
                                key={`${signer.address}`}
                                testID={`signer-${signer.address}`}
                                onPress={this.onSignerSelect}
                                label={signer.label}
                                labelSmall={Truncate(signer.address, 22)}
                                value={signer}
                                checked={selectedSigner?.address === signer.address}
                            />
                        )}

                        {signerDelegate && (
                            <RadioButton
                                key={`${signerDelegate.address}`}
                                testID={`signer-delegate-${signerDelegate.address}`}
                                onPress={this.onSignerSelect}
                                label={signerDelegate.label}
                                labelSmall={Truncate(signerDelegate.address, 22)}
                                value={signerDelegate}
                                checked={selectedSigner?.address === signerDelegate.address}
                            />
                        )}

                        <Button
                            testID="sign-button"
                            label={Localize.t('global.sign')}
                            onPress={this.onSignPress}
                            style={styles.signButton}
                            rounded
                        />
                    </View>
                </View>
            </AnimatedDialog>
        );
    }
}

export default SelectSigner;
