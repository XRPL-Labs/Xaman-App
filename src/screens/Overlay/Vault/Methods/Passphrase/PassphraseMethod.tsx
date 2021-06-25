/**
 * Vault / Passphrase Method
 */

import React, { Component } from 'react';
import { View, Text, Animated, LayoutAnimation, InteractionManager, KeyboardEvent } from 'react-native';

import { Keyboard } from '@common/helpers/keyboard';

import { PasswordInput, Button, Spacer } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

import { MethodsContext } from '../../Context';
import { AuthMethods } from '../../types';

/* types ==================================================================== */
export interface Props {}

export interface State {
    passphrase: string;
    offsetBottom: number;
}

/* Component ==================================================================== */
class PassphraseMethod extends Component<Props, State> {
    static contextType = MethodsContext;
    context: React.ContextType<typeof MethodsContext>;

    private contentView: View;
    private passwordInput: PasswordInput;
    private animatedColor: Animated.Value;

    constructor(props: Props) {
        super(props);

        this.state = {
            passphrase: undefined,
            offsetBottom: 0,
        };

        this.animatedColor = new Animated.Value(0);
    }

    componentDidMount() {
        this.startAuthentication();

        Keyboard.addListener('keyboardWillShow', this.onKeyboardShow);
        Keyboard.addListener('keyboardWillHide', this.onKeyboardHide);

        Animated.timing(this.animatedColor, {
            toValue: 150,
            duration: 350,
            useNativeDriver: false,
        }).start();

        InteractionManager.runAfterInteractions(this.startAuthentication);
    }

    componentWillUnmount() {
        Keyboard.removeListener('keyboardWillShow', this.onKeyboardShow);
        Keyboard.removeListener('keyboardWillHide', this.onKeyboardHide);
    }

    startAuthentication = () => {
        // focus the input
        if (this.passwordInput) {
            this.passwordInput.focus();
        }
    };

    onKeyboardShow = (e: KeyboardEvent) => {
        if (this.contentView) {
            this.contentView.measure((x, y, width, height) => {
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
        LayoutAnimation.easeInEaseOut();
        this.setState({ offsetBottom: 0 });
    };

    onPassphraseChange = (passphrase: string) => {
        this.setState({ passphrase });
    };

    onSignPress = () => {
        const { sign } = this.context;
        const { passphrase } = this.state;

        sign(AuthMethods.PASSPHRASE, { encryptionKey: passphrase });
    };

    render() {
        const { dismiss, signer } = this.context;
        const { offsetBottom, passphrase } = this.state;

        const interpolateColor = this.animatedColor.interpolate({
            inputRange: [0, 150],
            outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)'],
        });

        return (
            <Animated.View
                onStartShouldSetResponder={() => true}
                style={[styles.container, { backgroundColor: interpolateColor }]}
            >
                <View
                    ref={(r) => {
                        this.contentView = r;
                    }}
                    style={[styles.visibleContent, { marginBottom: offsetBottom }]}
                >
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
                                {Localize.t('account.PleaseEnterYourPasswordForAccount')}
                                <Text style={AppStyles.colorBlue}> &#34;{signer.label}&#34;</Text>
                            </Text>

                            <Spacer size={40} />

                            <PasswordInput
                                testID="passphrase-input"
                                ref={(r) => {
                                    this.passwordInput = r;
                                }}
                                placeholder={Localize.t('account.enterPassword')}
                                onChange={this.onPassphraseChange}
                                autoFocus
                            />

                            <Spacer size={40} />

                            <Button
                                testID="sign-button"
                                isDisabled={!passphrase}
                                label={Localize.t('global.sign')}
                                onPress={this.onSignPress}
                            />
                        </View>
                    </View>
                </View>
            </Animated.View>
        );
    }
}

/* Export Component ==================================================================== */
export default PassphraseMethod;
