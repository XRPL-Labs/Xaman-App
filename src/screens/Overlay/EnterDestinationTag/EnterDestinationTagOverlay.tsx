/**
 * Request decline overlay
 */
import React, { Component, createRef } from 'react';
import { Animated, View, Text, Image, TouchableWithoutFeedback, KeyboardEvent, Platform } from 'react-native';

import Interactable from 'react-native-interactable';

import { StringTypeDetector, StringDecoder, StringType } from 'xumm-string-decode';

import { Navigator } from '@common/helpers/navigator';
import { Images } from '@common/helpers/images';
import Keyboard from '@common/helpers/keyboard';

import { AppScreens } from '@common/constants';

// components
import { Button, TextInput } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    buttonType: 'next' | 'set';
    destination: any;
    onClose?: () => void;
    onFinish: (destinationTag: string) => void;
    onScannerRead?: (content: any) => void;
    onScannerClose?: () => void;
}

export interface State {
    offsetBottom: number;
    destinationTag: string;
}

/* Component ==================================================================== */
class EnterDestinationTagOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.EnterDestinationTag;
    private textInputView: React.RefObject<View>;

    textInput: TextInput;
    panel: any;
    deltaY: Animated.Value;
    deltaX: Animated.Value;
    keyboardShow: boolean;
    isOpening: boolean;

    static options() {
        return {
            statusBar: {
                visible: true,
                style: 'light',
            },
            topBar: {
                visible: false,
            },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            offsetBottom: 0,
            destinationTag: props.destination?.tag || '',
        };

        this.textInputView = createRef<View>();

        this.deltaY = new Animated.Value(AppSizes.screen.height);
        this.deltaX = new Animated.Value(0);

        this.keyboardShow = false;
        this.isOpening = true;
    }

    componentDidMount() {
        this.slideUp();

        // add listeners with delay as a bug in ios 14
        setTimeout(() => {
            this.addKeyboardListeners();
        }, 500);
    }

    removeKeyboardListeners = () => {
        Keyboard.removeListener('keyboardWillShow', this.onKeyboardShow);
        Keyboard.removeListener('keyboardWillHide', this.onKeyboardHide);
    };

    addKeyboardListeners = () => {
        Keyboard.addListener('keyboardWillShow', this.onKeyboardShow);
        Keyboard.addListener('keyboardWillHide', this.onKeyboardHide);
    };

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
                    this.setState({ offsetBottom: offset }, () => {
                        setTimeout(() => {
                            this.panel.snapTo({ index: 2 });
                        }, 0);
                    });
                }
            });
        }
    };

    onKeyboardHide = () => {
        if (!this.keyboardShow) return;

        this.keyboardShow = false;

        this.setState({ offsetBottom: 0 }, () => {
            this.panel.snapTo({ index: 1 });
        });
    };

    slideUp = () => {
        setTimeout(() => {
            if (this.panel) {
                this.panel.snapTo({ index: 1 });
            }
        }, 10);
    };

    slideDown = () => {
        this.removeKeyboardListeners();

        Keyboard.dismiss();

        setTimeout(() => {
            if (this.panel) {
                this.panel.snapTo({ index: 0 });
            }
        }, 20);
    };

    onAlert = (event: any) => {
        const { top, bottom } = event.nativeEvent;

        if (top && bottom) return;

        if (top === 'enter' && this.isOpening) {
            this.isOpening = false;
        }

        if (bottom === 'leave' && !this.isOpening) {
            const { onClose } = this.props;

            if (typeof onClose === 'function') {
                onClose();
            }

            Navigator.dismissOverlay();
        }
    };

    onFinish = async () => {
        const { destinationTag } = this.state;
        const { onFinish } = this.props;

        // close overlay
        Navigator.dismissOverlay();

        if (typeof onFinish === 'function') {
            onFinish(destinationTag);
        }
    };

    onDestinationTagChange = (destinationTag: string) => {
        if (destinationTag === '') {
            this.setState({
                destinationTag: '',
            });
            return;
        }

        const detected = new StringTypeDetector(destinationTag);

        if (detected.getType() === StringType.XrplDestinationTag) {
            const { tag } = new StringDecoder(detected).getXrplDestinationTag();

            this.setState({
                destinationTag: String(tag),
            });
        }
    };

    render() {
        const { onScannerRead, onScannerClose, destination, buttonType } = this.props;
        const { offsetBottom, destinationTag } = this.state;

        return (
            <View style={AppStyles.flex1}>
                <TouchableWithoutFeedback onPress={this.slideDown}>
                    <Animated.View
                        style={[
                            AppStyles.shadowContent,
                            {
                                opacity: this.deltaY.interpolate({
                                    inputRange: [0, AppSizes.screen.height],
                                    outputRange: [1.1, 0],
                                    extrapolateRight: 'clamp',
                                }),
                            },
                        ]}
                    />
                </TouchableWithoutFeedback>

                <Interactable.View
                    ref={(r) => {
                        this.panel = r;
                    }}
                    animatedNativeDriver
                    onAlert={this.onAlert}
                    verticalOnly
                    snapPoints={[
                        { y: AppSizes.screen.height + 3 },
                        { y: AppSizes.screen.height - AppSizes.moderateScale(450) - AppSizes.bottomInset },
                        {
                            y:
                                AppSizes.screen.height -
                                AppSizes.moderateScale(450) -
                                AppSizes.bottomInset -
                                offsetBottom,
                        },
                    ]}
                    alertAreas={[
                        { id: 'bottom', influenceArea: { bottom: AppSizes.screen.height } },
                        {
                            id: 'top',
                            influenceArea: {
                                top: AppSizes.screen.height - AppSizes.moderateScale(450) - AppSizes.bottomInset,
                            },
                        },
                    ]}
                    boundaries={{
                        top: AppSizes.screen.height - AppSizes.moderateScale(500) - AppSizes.bottomInset - offsetBottom,
                    }}
                    initialPosition={{ y: AppSizes.screen.height + 3 }}
                    animatedValueY={this.deltaY}
                    animatedValueX={this.deltaX}
                >
                    <View
                        style={[styles.container, { height: AppSizes.moderateScale(500) + AppSizes.bottomInset }]}
                        onResponderRelease={() => Keyboard.dismiss()}
                        onStartShouldSetResponder={() => true}
                    >
                        <View style={AppStyles.panelHeader}>
                            <View style={AppStyles.panelHandle} />
                        </View>

                        <View style={[AppStyles.row, AppStyles.centerAligned, AppStyles.paddingBottomSml]}>
                            <View style={[AppStyles.flex1, AppStyles.paddingLeftSml]}>
                                <Text numberOfLines={1} style={[AppStyles.h5, AppStyles.strong]}>
                                    {Localize.t('global.destinationTag')}
                                </Text>
                            </View>
                            <View
                                style={[AppStyles.row, AppStyles.flex1, AppStyles.paddingRightSml, AppStyles.flexEnd]}
                            >
                                <Button
                                    light
                                    roundedSmall
                                    isDisabled={false}
                                    onPress={this.slideDown}
                                    textStyle={[AppStyles.subtext, AppStyles.bold]}
                                    label={Localize.t('global.cancel')}
                                />
                            </View>
                        </View>
                        <View style={[AppStyles.paddingHorizontalSml]}>
                            <Text numberOfLines={1} style={[AppStyles.subtext, AppStyles.textCenterAligned]}>
                                {buttonType === 'next'
                                    ? Localize.t('send.thisAddressRequiredDestinationTag')
                                    : Localize.t('send.pleaseEnterTheDestinationTag')}
                            </Text>
                        </View>

                        <View style={[AppStyles.paddingHorizontalSml, AppStyles.paddingVerticalSml]}>
                            <View style={[styles.itemRow]}>
                                <View style={styles.avatarContainer}>
                                    <Image source={Images.IconInfo} style={styles.avatarImage} />
                                </View>
                                <View>
                                    <View style={AppStyles.row}>
                                        <Text style={[styles.title]}>
                                            {destination.name || Localize.t('global.noNameFound')}
                                        </Text>
                                    </View>
                                    <Text style={[styles.subtitle]}>{destination.address}</Text>
                                </View>
                            </View>
                        </View>

                        <View
                            ref={this.textInputView}
                            onLayout={() => {}}
                            style={[
                                AppStyles.paddingHorizontalSml,
                                AppStyles.paddingVertical,
                                AppStyles.centerContent,
                                AppStyles.centerAligned,
                            ]}
                        >
                            <TextInput
                                ref={(r) => {
                                    this.textInput = r;
                                }}
                                value={String(destinationTag)}
                                onChangeText={this.onDestinationTagChange}
                                keyboardType="number-pad"
                                returnKeyType="done"
                                placeholder={Localize.t('send.enterDestinationTag')}
                                numberOfLines={1}
                                inputStyle={styles.textInput}
                                showScanner
                                scannerType={StringType.XrplDestinationTag}
                                onScannerRead={onScannerRead}
                                onScannerClose={onScannerClose}
                                onScannerOpen={this.slideDown}
                            />
                        </View>

                        <View
                            style={[
                                AppStyles.centerContent,
                                AppStyles.paddingHorizontalSml,
                                AppStyles.paddingVertical,
                                { marginBottom: AppSizes.navigationBarHeight },
                            ]}
                        >
                            <Button
                                numberOfLines={1}
                                isDisabled={Number(destinationTag) > 2 ** 32 || Number(destinationTag) <= 0}
                                onPress={this.onFinish}
                                style={styles.nextButton}
                                label={buttonType === 'next' ? Localize.t('global.next') : Localize.t('global.apply')}
                            />
                        </View>
                    </View>
                </Interactable.View>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default EnterDestinationTagOverlay;
