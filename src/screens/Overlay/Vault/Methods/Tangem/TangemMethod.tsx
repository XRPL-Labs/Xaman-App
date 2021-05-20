/**
 * Vault / Tangem Method
 */

import React, { Component } from 'react';
import { View, Text, Animated, InteractionManager } from 'react-native';
import { Card } from 'tangem-sdk-react-native';

import { AccountSchema } from '@store/schemas/latest';
import { AccountTypes, EncryptionLevels } from '@store/types';

import { Button, RadioButton, Spacer } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

import { MethodsContext } from '../../Context';
import { AuthMethods } from '../../types';

/* types ==================================================================== */
export interface Props {}

export interface State {
    alternativeAccount: AccountSchema;
    preferredAccount: AccountSchema;
}

/* Component ==================================================================== */
class TangemMethod extends Component<Props, State> {
    static contextType = MethodsContext;
    context: React.ContextType<typeof MethodsContext>;

    private animatedColor: Animated.Value;

    constructor(props: Props) {
        super(props);

        this.state = {
            alternativeAccount: undefined,
            preferredAccount: undefined,
        };

        this.animatedColor = new Animated.Value(0);
    }

    componentDidMount() {
        Animated.timing(this.animatedColor, {
            toValue: 150,
            duration: 350,
            useNativeDriver: false,
        }).start();

        InteractionManager.runAfterInteractions(() => {
            this.setAvailableAccounts().then((shouldAuthorize) => {
                if (shouldAuthorize) {
                    this.startAuthentication();
                }
            });
        });
    }

    setAvailableAccounts = () => {
        const { signer, alternativeSigner } = this.context;

        return new Promise((resolve) => {
            // if no alternative signer return
            if (!alternativeSigner) {
                this.setState({
                    preferredAccount: signer,
                });

                return resolve(true);
            }

            if (
                alternativeSigner.encryptionLevel === EncryptionLevels.Physical &&
                alternativeSigner.type === AccountTypes.Tangem
            ) {
                this.setState({
                    preferredAccount: signer,
                    alternativeAccount: alternativeSigner,
                });
            }
            return resolve(false);
        });
    };

    startAuthentication = () => {
        const { sign } = this.context;

        const { preferredAccount } = this.state;

        if (!preferredAccount) {
            return;
        }

        const tangemCard = preferredAccount.additionalInfo as Card;

        sign(AuthMethods.TANGEM, { tangemCard });
    };

    onPreferredAccountSelect = (account: AccountSchema) => {
        this.setState({
            preferredAccount: account,
        });
    };

    render() {
        const { dismiss, signer } = this.context;
        const { alternativeAccount, preferredAccount } = this.state;

        if (!alternativeAccount) return null;

        const interpolateColor = this.animatedColor.interpolate({
            inputRange: [0, 150],
            outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)'],
        });

        return (
            <Animated.View
                onStartShouldSetResponder={() => true}
                style={[styles.container, { backgroundColor: interpolateColor }]}
            >
                <View style={[styles.visibleContent]}>
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
                                {Localize.t('account.thereAreTwoAccountsEligibleToSign')}
                            </Text>

                            <Spacer size={40} />

                            <RadioButton
                                testID="signer-tangem-card"
                                onPress={this.onPreferredAccountSelect}
                                label={signer.label}
                                value={signer}
                                description={Localize.t('account.mainAccount')}
                                checked={preferredAccount.address === signer.address}
                            />

                            <RadioButton
                                testID="alternative-tangem-card"
                                onPress={this.onPreferredAccountSelect}
                                label={alternativeAccount.label}
                                value={alternativeAccount}
                                description={Localize.t('account.backupAccount')}
                                checked={preferredAccount.address === alternativeAccount.address}
                            />

                            <Spacer size={20} />

                            <View style={[AppStyles.paddingTopSml, AppStyles.row]}>
                                <Button
                                    testID="sign-button"
                                    rounded
                                    label={Localize.t('global.sign')}
                                    onPress={this.startAuthentication}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </Animated.View>
        );
    }
}

/* Export Component ==================================================================== */
export default TangemMethod;
