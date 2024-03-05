/**
 * Flagged Destination Modal
 */

import toUpper from 'lodash/toUpper';
import React, { Component, createRef } from 'react';
import { View, Animated, Text, KeyboardEvent, Platform, BackHandler, NativeEventSubscription } from 'react-native';

import { AppScreens } from '@common/constants';

import { Navigator } from '@common/helpers/navigator';
import Keyboard from '@common/helpers/keyboard';

import BackendService from '@services/BackendService';

// components
import { Button, TextInput, Spacer, Icon } from '@components/General';
import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    destination: string;
    onContinue: () => void;
    onDismissed?: () => void;
}

export interface State {
    reasonText: string;
    isLoading: boolean;
}
/* Component ==================================================================== */
class FlaggedDestinationOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.FlaggedDestination;

    private animatedColor: Animated.Value;
    private animatedOpacity: Animated.Value;
    private keyboardShow: boolean;
    private textInputView: React.RefObject<View>;
    private bottomOffset: Animated.Value;

    private backHandler: NativeEventSubscription | undefined;
    private setListenerTimeout: NodeJS.Timeout | undefined;

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
            reasonText: '',
            isLoading: false,
        };

        this.animatedColor = new Animated.Value(0);
        this.animatedOpacity = new Animated.Value(1);

        this.textInputView = createRef<View>();
        this.keyboardShow = false;
        this.bottomOffset = new Animated.Value(0);
    }

    componentDidMount() {
        this.mounted = true;

        // prevent from hardware back in android devices
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);

        Animated.timing(this.animatedColor, {
            toValue: 150,
            duration: 350,
            useNativeDriver: false,
        }).start();

        // add listeners with delay as a bug in ios 14
        this.setListenerTimeout = setTimeout(() => {
            Keyboard.addListener('keyboardWillShow', this.onKeyboardShow);
            Keyboard.addListener('keyboardWillHide', this.onKeyboardHide);
        }, 500);
    }

    componentWillUnmount() {
        this.mounted = false;

        if (this.backHandler) {
            this.backHandler.remove();
        }

        if (this.setListenerTimeout) clearTimeout(this.setListenerTimeout);

        Keyboard.removeListener('keyboardWillShow', this.onKeyboardShow);
        Keyboard.removeListener('keyboardWillHide', this.onKeyboardHide);
    }

    onKeyboardShow = (e: KeyboardEvent) => {
        if (this.keyboardShow) return;

        this.keyboardShow = true;

        if (this.textInputView && this.textInputView.current) {
            this.textInputView.current.measure((x, y, width, height, pageX, pageY) => {
                if (!pageY) return;

                const bottomView = AppSizes.screen.height - height - pageY;
                const KeyboardHeight = e.endCoordinates.height;

                let offset = KeyboardHeight - bottomView;

                if (Platform.OS === 'android') {
                    offset += AppSizes.topInset + AppSizes.bottomInset;
                }

                if (offset >= 0) {
                    Animated.spring(this.bottomOffset, {
                        toValue: offset,
                        useNativeDriver: false,
                    }).start();
                }
            });
        }
    };

    onKeyboardHide = () => {
        if (!this.keyboardShow) return;

        this.keyboardShow = false;

        Animated.spring(this.bottomOffset, {
            toValue: 0,
            useNativeDriver: false,
        }).start();
    };

    dismiss = (callback?: () => void) => {
        Animated.parallel([
            Animated.timing(this.animatedOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
            }),
            Animated.timing(this.animatedColor, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
            }),
        ]).start(() => {
            Navigator.dismissOverlay();

            if (typeof callback === 'function') {
                callback();
            }
        });
    };

    onDismiss = () => {
        const { onDismissed } = this.props;

        this.dismiss(onDismissed);

        return true;
    };

    onContinuePressed = () => {
        const { destination, onContinue } = this.props;
        const { reasonText } = this.state;

        this.setState({
            isLoading: true,
        });

        BackendService.auditTrail(destination, { reason: reasonText })
            .then(() => {
                if (this && this.mounted) {
                    this.dismiss(onContinue);
                }
            })
            .catch(() => {
                this.setState({
                    isLoading: false,
                });
            });
    };

    onReasonTextChange = (reasonText: string) => {
        this.setState({
            reasonText,
        });
    };

    render() {
        const { destination } = this.props;
        const { reasonText, isLoading } = this.state;

        const interpolateColor = this.animatedColor.interpolate({
            inputRange: [0, 150],
            outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)'],
        });

        return (
            <Animated.View
                onResponderRelease={() => {
                    Keyboard.dismiss();
                }}
                onStartShouldSetResponder={() => true}
                style={[styles.container, { backgroundColor: interpolateColor }]}
            >
                <Animated.View
                    style={[styles.visibleContent, { opacity: this.animatedOpacity, marginBottom: this.bottomOffset }]}
                >
                    <View style={[AppStyles.centerAligned]}>
                        <Icon style={styles.iconError} name="IconInfo" size={60} />
                    </View>

                    <View style={AppStyles.centerAligned}>
                        <Text style={[styles.title, styles.titleError]}>{toUpper(Localize.t('global.danger'))}!</Text>
                        <Text style={[styles.subTitle, styles.titleError]}>
                            {Localize.t('send.probableLossOfFunds')}
                        </Text>
                    </View>

                    <View style={[AppStyles.centerAligned, AppStyles.paddingTopSml]}>
                        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.address}>
                            &quot;{destination}&quot;
                        </Text>
                        <Spacer size={5} />
                        <Text style={styles.subTitle}>
                            {Localize.t('send.addressIsUnderInvestigationPleaseCancel')}
                        </Text>
                        <Spacer size={30} />
                        <Text style={styles.subTitle}>{Localize.t('send.toContinueProvideReasonInYourOwnWords')}</Text>
                    </View>

                    <View collapsable={false} ref={this.textInputView} style={[AppStyles.paddingVertical]}>
                        <TextInput
                            multiline
                            blurOnSubmit
                            maxLength={600}
                            onSubmitEditing={Keyboard.dismiss}
                            onChangeText={this.onReasonTextChange}
                            containerStyle={styles.textInputContainer}
                            returnKeyType="done"
                            textAlignVertical="center"
                            textAlign="center"
                            placeholder={Localize.t('send.pleaseEnterYourReasonToContinue')}
                        />
                    </View>

                    <View style={[AppStyles.row]}>
                        <View style={[AppStyles.flex1, AppStyles.paddingRightSml]}>
                            <Button onPress={this.onDismiss} label="Cancel" />
                        </View>
                        <View style={[AppStyles.flex1]}>
                            <Button
                                light
                                isLoading={isLoading}
                                isDisabled={!reasonText}
                                onPress={this.onContinuePressed}
                                label={Localize.t('global.continue')}
                            />
                        </View>
                    </View>
                </Animated.View>
            </Animated.View>
        );
    }
}

/* Export Component ==================================================================== */
export default FlaggedDestinationOverlay;
