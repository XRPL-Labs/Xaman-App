/**
 * Tangem card security method change
 */

import React, { Component } from 'react';
import { View, ScrollView } from 'react-native';

import RNTangemSdk, { Card } from 'tangem-sdk-react-native';

import { AppScreens } from '@common/constants';

import { Navigator } from '@common/helpers/navigator';
import { Prompt } from '@common/helpers/interface';

import { GetCardEnforcedSecurity, GetCardSecurityOptions, TangemSecurity } from '@common/utils/tangem';

import { AccountRepository } from '@store/repositories';
import { AccountSchema } from '@store/schemas/latest';

import LoggerService from '@services/LoggerService';

import { Header, Footer, Button, RadioButton } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';
/* types ==================================================================== */
export interface Props {
    account: AccountSchema;
}

export interface State {
    currentSecurity: TangemSecurity;
    chosenSecurity: TangemSecurity;
    isSettingPasscodeAllowed: boolean;
    isSettingAccessCodeAllowed: boolean;
}

/* Component ==================================================================== */
class ChangeTangemSecurityView extends Component<Props, State> {
    static screenName = AppScreens.Account.Edit.ChangeTangemSecurityEnforce;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        const current = GetCardEnforcedSecurity(props.account.additionalInfo);
        const securityOptions = GetCardSecurityOptions(props.account.additionalInfo);

        this.state = {
            currentSecurity: current,
            chosenSecurity: current,
            isSettingPasscodeAllowed: securityOptions.Passcode,
            isSettingAccessCodeAllowed: securityOptions.AccessCode,
        };
    }

    componentDidMount() {
        RNTangemSdk.startSession({
            attestationMode: 'offline',
        }).catch((e) => {
            LoggerService.recordError('Unexpected error TangemSDK startSession', e);
        });
    }

    componentWillUnmount() {
        RNTangemSdk.stopSession().catch(() => {
            // ignore
        });
    }

    onSecurityChange = (security: TangemSecurity) => {
        this.setState({
            chosenSecurity: security,
        });
    };

    onSuccessChange = (changes: any) => {
        const { chosenSecurity } = this.state;
        const { account } = this.props;

        AccountRepository.update({
            address: account.address,
            additionalInfoString: JSON.stringify({
                ...account.additionalInfo,
                ...changes,
            }),
        });

        Prompt(
            Localize.t('global.success'),
            Localize.t('account.cardSecuritySuccessfullyChangedTo', { security: chosenSecurity }),
            [
                {
                    onPress: Navigator.pop,
                },
            ],
            { type: 'default' },
        );
    };

    resetUserCodes = () => {
        const { account } = this.props;
        const { cardId } = account.additionalInfo as Card;

        RNTangemSdk.resetUserCodes({ cardId })
            .then(this.onSuccessChange.bind(null, { isPasscodeSet: false, isAccessCodeSet: false }))
            .catch(() => {
                // ignore
            });
    };

    changeAccessCode = () => {
        const { account } = this.props;
        const { cardId } = account.additionalInfo as Card;

        RNTangemSdk.setAccessCode({ cardId })
            .then(this.onSuccessChange.bind(null, { isAccessCodeSet: true }))
            .catch(() => {
                // ignore
            });
    };

    changePasscode = () => {
        const { account } = this.props;
        const { cardId } = account.additionalInfo as Card;

        RNTangemSdk.setPasscode({ cardId })
            .then(this.onSuccessChange.bind(null, { isPasscodeSet: true }))
            .catch(() => {
                // ignore
            });
    };

    onSavePress = () => {
        const { chosenSecurity, currentSecurity } = this.state;

        // no changes
        if (chosenSecurity === currentSecurity) {
            return;
        }

        switch (chosenSecurity) {
            case TangemSecurity.Passcode:
                Navigator.showAlertModal({
                    type: 'warning',
                    text: Localize.t('account.tangemCardPasscodeSetWarning'),
                    buttons: [
                        {
                            text: Localize.t('global.cancel'),
                            type: 'dismiss',
                            light: true,
                        },
                        {
                            text: Localize.t('global.doIt'),
                            onPress: this.changePasscode,
                            type: 'continue',
                            light: false,
                        },
                    ],
                });
                break;
            case TangemSecurity.AccessCode:
                Navigator.showAlertModal({
                    type: 'warning',
                    text: Localize.t('account.tangemCardAccessCodeSetWarning'),
                    buttons: [
                        {
                            text: Localize.t('global.cancel'),
                            type: 'dismiss',
                            light: true,
                        },
                        {
                            text: Localize.t('global.doIt'),
                            onPress: this.changeAccessCode,
                            type: 'continue',
                            light: false,
                        },
                    ],
                });
                break;
            case TangemSecurity.LongTap:
                this.resetUserCodes();
                break;
            default:
                break;
        }
    };

    render() {
        const { chosenSecurity, currentSecurity, isSettingPasscodeAllowed, isSettingAccessCodeAllowed } = this.state;

        return (
            <View testID="account-change-tangem-security-view" style={styles.container}>
                <Header
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: Navigator.pop,
                    }}
                    centerComponent={{ text: Localize.t('account.cardSecurity') }}
                />

                <ScrollView
                    bounces={false}
                    contentContainerStyle={[AppStyles.contentContainer, AppStyles.centerContent, AppStyles.paddingSml]}
                >
                    <RadioButton
                        testID="long-tap-radio-button"
                        onPress={this.onSecurityChange}
                        description={Localize.t('account.tangemLongTapExplain')}
                        label={Localize.t('global.longTap')}
                        value={TangemSecurity.LongTap}
                        checked={chosenSecurity === TangemSecurity.LongTap}
                    />

                    {/*
                         only show this option if has been chosen before or setting access code is disabled
                    */}
                    {(currentSecurity === TangemSecurity.Passcode || !isSettingAccessCodeAllowed) && (
                        <RadioButton
                            testID="passcode-radio-button"
                            onPress={this.onSecurityChange}
                            description={Localize.t('account.tangemPasscodeExplain')}
                            label={Localize.t('global.passcode')}
                            value={TangemSecurity.Passcode}
                            checked={chosenSecurity === TangemSecurity.Passcode}
                            disabled={isSettingAccessCodeAllowed || !isSettingPasscodeAllowed}
                        />
                    )}

                    {(currentSecurity === TangemSecurity.AccessCode || isSettingAccessCodeAllowed) && (
                        <RadioButton
                            testID="access-code-radio-button"
                            onPress={this.onSecurityChange}
                            description={Localize.t('account.tangemAccessCodeExplain')}
                            label={Localize.t('global.accessCode')}
                            value={TangemSecurity.AccessCode}
                            checked={chosenSecurity === TangemSecurity.AccessCode}
                            disabled={currentSecurity === TangemSecurity.Passcode}
                        />
                    )}
                </ScrollView>

                <Footer safeArea>
                    <Button
                        testID="save-button"
                        isDisabled={chosenSecurity === currentSecurity}
                        label={Localize.t('global.save')}
                        onPress={this.onSavePress}
                    />
                </Footer>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default ChangeTangemSecurityView;
