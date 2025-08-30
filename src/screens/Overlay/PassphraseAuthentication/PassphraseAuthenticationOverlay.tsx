/**
 * Passphrase account authentication
 * Auth account with passphrase as security level
 */

import React, { Component } from 'react';
import {
    View,
    Animated,
    Text,
    BackHandler,
    KeyboardEvent,
    LayoutAnimation,
    InteractionManager,
    NativeEventSubscription,
    Platform,
    Linking,
    Alert,
} from 'react-native';

import { AppScreens } from '@common/constants';
import { WebLinks } from '@common/constants/endpoints';

import StyleService from '@services/StyleService';

import { CoreRepository } from '@store/repositories';
import { AccountModel, CoreModel } from '@store/models';

import Keyboard from '@common/helpers/keyboard';
import { Navigator } from '@common/helpers/navigator';
import { Prompt, VibrateHapticFeedback } from '@common/helpers/interface';

import Vault from '@common/libs/vault';

// components
import { Button, PasswordInput, Spacer } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    account: AccountModel;
    onSuccess: (passphrase: string) => void;
    onDismissed?: () => void;
}

export interface State {
    coreSettings: CoreModel;
    passphrase?: string;
    offsetBottom: number;
}
/* Component ==================================================================== */
class PassphraseAuthenticationOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.PassphraseAuthentication;
    private contentViewRef: React.RefObject<View>;
    private passwordInputRef: React.RefObject<PasswordInput>;

    private animatedColor: Animated.Value;
    private backHandler: NativeEventSubscription | undefined;

    private mounted = false;

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
            coreSettings: CoreRepository.getSettings(),
            passphrase: undefined,
            offsetBottom: 0,
        };

        this.contentViewRef = React.createRef();
        this.passwordInputRef = React.createRef();

        this.animatedColor = new Animated.Value(0);
    }

    componentDidMount() {
        // track component mount status
        this.mounted = true;

        // listen on keyboard events
        Keyboard.addListener('keyboardWillShow', this.onKeyboardShow);
        Keyboard.addListener('keyboardWillHide', this.onKeyboardHide);

        // android back handler
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.dismiss);

        // animate the background color
        Animated.timing(this.animatedColor, {
            toValue: 150,
            duration: 350,
            useNativeDriver: false,
        }).start();

        InteractionManager.runAfterInteractions(this.startAuthentication);
    }

    componentWillUnmount() {
        // track component mount status
        this.mounted = false;

        // remove all listeners
        if (this.backHandler) {
            this.backHandler.remove();
        }

        Keyboard.removeListener('keyboardWillShow', this.onKeyboardShow);
        Keyboard.removeListener('keyboardWillHide', this.onKeyboardHide);
    }

    startAuthentication = () => {
        // focus the input
        this.passwordInputRef?.current?.focus();
    };

    onAuthenticatePress = async () => {
        const { account } = this.props;
        const { passphrase } = this.state;

        // passphrase is empty ??
        if (!passphrase) {
            return;
        }

        // blur the input if android
        if (Platform.OS === 'android') {
            this.passwordInputRef?.current?.blur();
        }

        // try to fetch the private key from vault with provided passphrase
        let privateKey = await Vault.open(account.publicKey, passphrase);

        // invalid authentication
        if (!privateKey) {
            this.onInvalidAuthentication();
            return;
        }

        // clear the private key
        privateKey = undefined;

        // run the success authentication
        this.onSuccessAuthentication(passphrase);
    };

    onPassphraseChange = (passphrase: string) => {
        this.setState({ passphrase });
    };

    onKeyboardShow = (e: KeyboardEvent) => {
        if (this.contentViewRef.current && this.mounted) {
            this.contentViewRef.current.measure((x, y, width, height) => {
                const bottomView = (AppSizes.screen.height - height) / 2;
                const KeyboardHeight = e.endCoordinates.height + 100;

                if (bottomView < KeyboardHeight) {
                    LayoutAnimation.easeInEaseOut();
                    this.setState({ offsetBottom: KeyboardHeight - bottomView });
                }
            });
        }
    };

    onKeyboardHide = () => {
        if (this.mounted) {
            LayoutAnimation.easeInEaseOut();
            this.setState({ offsetBottom: 0 });
        }
    };

    close = () => {
        Keyboard.dismiss();
        Navigator.dismissOverlay();
    };

    dismiss = () => {
        const { onDismissed } = this.props;

        if (onDismissed) {
            onDismissed();
        }

        this.close();

        return true;
    };

    openTroubleshootLink = () => {
        Linking.openURL(WebLinks.FAQAccountSigningPasswordURL).catch(() => {
            Alert.alert(Localize.t('global.error'), Localize.t('global.cannotOpenLink'));
        });
    };

    onInvalidAuthentication = () => {
        const { coreSettings } = this.state;

        // wrong passcode entered
        if (coreSettings.hapticFeedback) {
            VibrateHapticFeedback('notificationError');
        }

        Prompt(
            Localize.t('global.incorrectPassword'),
            Localize.t('global.thePasswordYouEnteredIsIncorrectExplain'),
            [
                {
                    text: Localize.t('global.troubleshoot'),
                    onPress: this.openTroubleshootLink,
                },
                { text: Localize.t('global.tryAgain') },
            ],
            { type: 'default' },
        );
    };

    onSuccessAuthentication = (passphrase: string) => {
        const { onSuccess } = this.props;

        if (typeof onSuccess === 'function') {
            onSuccess(passphrase);
        }

        this.close();
    };

    render() {
        const { account } = this.props;
        const { offsetBottom, passphrase } = this.state;

        // if account has been removed then we need to return null otherwise we will get error
        if (!account.isValid()) {
            return null;
        }

        const interpolateColor = this.animatedColor.interpolate({
            inputRange: [0, 150],
            outputRange: StyleService.getBackdropInterpolateColor(),
        });

        return (
            <Animated.View
                onStartShouldSetResponder={() => true}
                style={[styles.container, { backgroundColor: interpolateColor }]}
            >
                <View ref={this.contentViewRef} style={[styles.visibleContent, { marginBottom: offsetBottom }]}>
                    <View style={[AppStyles.row, AppStyles.centerAligned]}>
                        <View style={[AppStyles.flex1, AppStyles.paddingLeftSml, AppStyles.paddingRightSml]}>
                            <Text numberOfLines={1} style={[AppStyles.p, AppStyles.bold]}>
                                {Localize.t('global.authenticate')}
                            </Text>
                        </View>
                        <View style={[AppStyles.row, AppStyles.flex1, AppStyles.flexEnd]}>
                            <Button
                                light
                                numberOfLines={1}
                                label={Localize.t('global.cancel')}
                                roundedSmall
                                onPress={this.close}
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
                                {Localize.t('account.PleaseEnterYourPasswordForAccount')}
                                <Text style={AppStyles.colorBlue}> &#34;{account.label}&#34;</Text>
                            </Text>

                            <Spacer size={40} />

                            <PasswordInput
                                testID="passphrase-input"
                                ref={this.passwordInputRef}
                                placeholder={Localize.t('account.enterPassword')}
                                onChange={this.onPassphraseChange}
                                autoFocus
                            />

                            <Spacer size={40} />

                            <Button
                                testID="check-button"
                                isDisabled={!passphrase}
                                label={Localize.t('global.authenticate')}
                                onPress={this.onAuthenticatePress}
                            />
                        </View>
                    </View>
                </View>
            </Animated.View>
        );
    }
}

/* Export Component ==================================================================== */
export default PassphraseAuthenticationOverlay;
