/**
 * Lock screen
 */

import React, { Component } from 'react';
import { View, Text, SafeAreaView, Image } from 'react-native';
import TouchID from 'react-native-touch-id';

import { BlurView } from '@react-native-community/blur';

import { CoreRepository } from '@store/repositories';
import { CoreSchema } from '@store/schemas/latest';
import { BiometryType } from '@store/types';

import { Navigator, Images } from '@common/helpers';
import { AppScreens } from '@common/constants';

// components
import { SecurePinInput, Spacer } from '@components';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    onUnlock: () => void;
}

export interface State {
    error: string;
    coreSettings: CoreSchema;
}
/* Component ==================================================================== */
class LockModal extends Component<Props, State> {
    static screenName = AppScreens.Overlay.Lock;

    private securePinInput: SecurePinInput;
    private contentView: SafeAreaView;

    static options() {
        return {
            topBar: {
                visible: false,
            },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            error: undefined,
            coreSettings: CoreRepository.getSettings(),
        };
    }

    componentDidMount() {
        const { coreSettings } = this.state;

        if (coreSettings.biometricMethod !== BiometryType.None) {
            setTimeout(() => {
                this.requestBiometricAuthenticate();
            }, 100);
        }
    }

    onPasscodeEntered = (passcode: string) => {
        const { onUnlock } = this.props;

        CoreRepository.checkPasscode(passcode)
            .then(() => {
                Navigator.dismissOverlay();

                if (typeof onUnlock === 'function') {
                    onUnlock();
                }
            })
            .catch(e => {
                this.setState({
                    error: e.toString().replace('Error: ', ''),
                });
            })
            .finally(() => {
                this.securePinInput.clearInput();
            });
    };

    requestBiometricAuthenticate = () => {
        const { onUnlock } = this.props;
        const optionalConfigObject = {
            title: Localize.t('global.authenticationRequired'),
            sensorErrorDescription: Localize.t('global.failed'),
            cancelText: Localize.t('global.cancel'),
            fallbackLabel: 'Show Passcode',
            unifiedErrors: true,
            passcodeFallback: true,
        };

        TouchID.authenticate(Localize.t('global.unlock'), optionalConfigObject)
            .then(() => {
                CoreRepository.updateTimeLastUnlocked();
                Navigator.dismissOverlay();

                if (typeof onUnlock === 'function') {
                    onUnlock();
                }
            })
            .catch(() => {});
    };

    render() {
        const { error, coreSettings } = this.state;
        return (
            <>
                <BlurView style={styles.blurView} blurAmount={20} blurType="light" />
                <SafeAreaView style={styles.container}>
                    <View
                        style={[
                            AppStyles.flex3,
                            AppStyles.centerAligned,
                            AppStyles.centerContent,
                            AppStyles.paddingSml,
                        ]}
                    >
                        <Image style={styles.logo} source={Images.xummLogo} />
                        <Spacer size={50} />
                        <Text style={[AppStyles.p, AppStyles.bold]}>
                            {Localize.t('global.pleaseEnterYourPasscode')}
                        </Text>

                        <Spacer size={20} />

                        <Text style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned, AppStyles.colorRed]}>
                            {error}
                        </Text>
                    </View>

                    <View style={[AppStyles.flex5, AppStyles.flexEnd]}>
                        <SecurePinInput
                            ref={r => {
                                this.securePinInput = r;
                            }}
                            virtualKeyboard
                            supportBiometric={coreSettings.biometricMethod !== BiometryType.None}
                            onBiometryPress={this.requestBiometricAuthenticate}
                            onInputFinish={this.onPasscodeEntered}
                            length={6}
                        />
                    </View>
                </SafeAreaView>
            </>
        );
    }
}

/* Export Component ==================================================================== */
export default LockModal;
