/**
 * Enter destination tag overlay
 */
import React, { Component, createRef } from 'react';
import { View, Text, Image, KeyboardEvent, Platform } from 'react-native';

import { StringTypeDetector, StringDecoder, StringType } from 'xumm-string-decode';

import { Navigator } from '@common/helpers/navigator';
import { Images } from '@common/helpers/images';
import Keyboard from '@common/helpers/keyboard';

import { StringTypeCheck } from '@common/utils/string';

import { AppScreens } from '@common/constants';

// components
import { Button, TextInput, ActionPanel } from '@components/General';

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
    private setListenerTimeout: any;
    private keyboardShow: boolean;
    private actionPanelRef: React.RefObject<ActionPanel>;

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
        this.actionPanelRef = createRef<ActionPanel>();

        this.keyboardShow = false;
    }

    componentDidMount() {
        // add listeners with delay as a bug in ios 14
        this.setListenerTimeout = setTimeout(() => {
            Keyboard.addListener('keyboardWillShow', this.onKeyboardShow);
            Keyboard.addListener('keyboardWillHide', this.onKeyboardHide);
        }, 500);
    }

    componentWillUnmount() {
        if (this.setListenerTimeout) clearTimeout(this.setListenerTimeout);

        Keyboard.removeListener('keyboardWillShow', this.onKeyboardShow);
        Keyboard.removeListener('keyboardWillHide', this.onKeyboardHide);
    }

    onKeyboardShow = (e: KeyboardEvent) => {
        if (this.keyboardShow) return;

        this.keyboardShow = true;

        this.textInputView?.current?.measure((x, y, width, height, pageX, pageY) => {
            if (!pageY) return;

            const bottomView = AppSizes.screen.height - height - pageY;
            const KeyboardHeight = e.endCoordinates.height;

            let offset = KeyboardHeight - bottomView;

            if (Platform.OS === 'android') {
                offset += AppSizes.safeAreaBottomInset;
            }

            if (offset >= 0) {
                this.setState({ offsetBottom: offset }, () => {
                    setTimeout(() => {
                        if (this.actionPanelRef?.current) {
                            this.actionPanelRef?.current.snapTo(2);
                        }
                    }, 10);
                });
            }
        });
    };

    onKeyboardHide = () => {
        if (!this.keyboardShow) return;

        this.keyboardShow = false;

        this.setState({ offsetBottom: 0 }, () => {
            setTimeout(() => {
                if (this.actionPanelRef?.current) {
                    this.actionPanelRef?.current.snapTo(1);
                }
            }, 10);
        });
    };

    onClose = () => {
        const { onClose } = this.props;

        if (typeof onClose === 'function') {
            onClose();
        }

        Navigator.dismissOverlay();
    };

    onFinish = async () => {
        const { destinationTag } = this.state;
        const { onFinish } = this.props;

        // close overlay
        await Navigator.dismissOverlay();

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

    slideDownPanel = () => {
        if (this.actionPanelRef?.current) {
            this.actionPanelRef.current.slideDown();
        }
    };

    render() {
        const { onScannerRead, onScannerClose, destination, buttonType } = this.props;
        const { offsetBottom, destinationTag } = this.state;

        return (
            <ActionPanel
                ref={this.actionPanelRef}
                height={AppSizes.moderateScale(430)}
                offset={offsetBottom}
                onSlideDown={this.onClose}
                extraBottomInset
            >
                <View style={[AppStyles.row, AppStyles.centerAligned, AppStyles.paddingBottomSml]}>
                    <View style={[AppStyles.flex1, AppStyles.paddingLeftSml]}>
                        <Text numberOfLines={1} style={[AppStyles.h5, AppStyles.strong]}>
                            {Localize.t('global.destinationTag')}
                        </Text>
                    </View>
                    <View style={[AppStyles.row, AppStyles.flex1, AppStyles.paddingRightSml, AppStyles.flexEnd]}>
                        <Button
                            light
                            roundedSmall
                            isDisabled={false}
                            onPress={this.slideDownPanel}
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
                    <View style={styles.itemRow}>
                        <View style={styles.avatarContainer}>
                            <Image source={Images.IconInfo} style={styles.avatarImage} />
                        </View>
                        <View>
                            <View style={AppStyles.row}>
                                <Text style={styles.title}>{destination.name || Localize.t('global.noNameFound')}</Text>
                            </View>
                            <Text style={styles.subtitle}>{destination.address}</Text>
                        </View>
                    </View>
                </View>

                <View
                    ref={this.textInputView}
                    style={[
                        AppStyles.paddingHorizontalSml,
                        AppStyles.paddingVertical,
                        AppStyles.centerContent,
                        AppStyles.centerAligned,
                    ]}
                    collapsable={false}
                >
                    <TextInput
                        value={destinationTag}
                        keyboardType="number-pad"
                        returnKeyType="done"
                        numberOfLines={1}
                        inputStyle={destinationTag ? styles.textInput : styles.textInputPlaceholder}
                        placeholder={Localize.t('send.enterDestinationTag')}
                        showScanner
                        onChangeText={this.onDestinationTagChange}
                        scannerType={StringType.XrplDestinationTag}
                        onScannerRead={onScannerRead}
                        onScannerClose={onScannerClose}
                        onScannerOpen={this.slideDownPanel}
                    />
                </View>

                <View style={[AppStyles.centerContent, AppStyles.paddingHorizontalSml, AppStyles.paddingVertical]}>
                    <Button
                        numberOfLines={1}
                        isDisabled={!StringTypeCheck.isValidDestinationTag(destinationTag) && destinationTag !== ''}
                        onPress={this.onFinish}
                        style={styles.nextButton}
                        label={buttonType === 'next' ? Localize.t('global.next') : Localize.t('global.apply')}
                    />
                </View>
            </ActionPanel>
        );
    }
}

/* Export Component ==================================================================== */
export default EnterDestinationTagOverlay;
