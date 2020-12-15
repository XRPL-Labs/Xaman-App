/**
 * Add Account Screen
 */

import React, { Component } from 'react';
import { View, Text, Image, ImageBackground, Alert, InteractionManager } from 'react-native';

import RNTangemSdk, { Card, CardStatus, EventCallback } from 'tangem-sdk-react-native';

import { Navigator } from '@common/helpers/navigator';
import { Images } from '@common/helpers/images';
import { Prompt } from '@common/helpers/interface';

import { AppScreens } from '@common/constants';

// components
import { Button, Header, Spacer } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    NFCSupported: boolean;
    NFCEnabled: boolean;
}

/* Component ==================================================================== */
class AccountAddView extends Component<Props, State> {
    static screenName = AppScreens.Account.Add;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            NFCSupported: false,
            NFCEnabled: false,
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(() => {
            // on NFC state change (Android)
            RNTangemSdk.on('NFCStateChange', this.onNFCStateChange);

            // get current NFC status

            RNTangemSdk.getNFCStatus().then((status) => {
                const { support, enabled } = status;

                this.setState({
                    NFCSupported: support,
                    NFCEnabled: enabled,
                });
            });
        });
    }

    componentWillUnmount() {
        RNTangemSdk.removeListener('NFCStateChange', this.onNFCStateChange);

        RNTangemSdk.stopSession();
    }

    onNFCStateChange = ({ enabled }: EventCallback) => {
        this.setState({
            NFCEnabled: enabled,
        });
    };

    goToImport = (props?: any) => {
        Navigator.push(AppScreens.Account.Import, {}, props);
    };

    goToGenerate = () => {
        Navigator.push(AppScreens.Account.Generate);
    };

    createTangemWallet = (card: Card) => {
        const { cardId } = card;

        RNTangemSdk.createWallet(cardId)
            .then((resp) => {
                this.goToImport({ tangemCard: { ...card, ...resp } });
            })
            .catch(() => {
                // ignore
            });
    };

    scanTangemCard = () => {
        RNTangemSdk.scanCard()
            .then((card) => {
                const { cardData, status } = card;
                if (cardData.blockchainName !== 'XRP') {
                    Alert.alert(Localize.t('global.error'), Localize.t('account.scannedCardIsNotATangemXRPCard'));
                    return;
                }
                if (status === CardStatus.Empty) {
                    Prompt(
                        Localize.t('global.notice'),
                        Localize.t('account.tangemCardEmptyGenerateWalletAlert'),
                        [
                            { text: Localize.t('global.cancel') },
                            {
                                text: Localize.t('account.generateAccount'),
                                onPress: () => {
                                    this.createTangemWallet(card);
                                },
                            },
                        ],
                        { type: 'default' },
                    );
                } else {
                    this.goToImport({ tangemCard: card });
                }
            })
            .catch(() => {
                // ignore
            });
    };

    onAddTangemCardPress = () => {
        const { NFCSupported, NFCEnabled } = this.state;

        if (!NFCSupported) {
            Alert.alert(Localize.t('global.error'), Localize.t('account.tangemNFCNotSupportedDeviceAlert'));
            return;
        }

        RNTangemSdk.startSession();

        if (NFCEnabled) {
            this.scanTangemCard();
        }
    };

    render() {
        return (
            <View testID="account-add-screen" style={[AppStyles.container]}>
                <Header
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: () => {
                            Navigator.pop();
                        },
                    }}
                    centerComponent={{ text: Localize.t('account.addAccount') }}
                />
                <View style={[AppStyles.contentContainer, AppStyles.paddingHorizontal, AppStyles.paddingBottom]}>
                    <ImageBackground
                        source={Images.BackgroundShapes}
                        imageStyle={AppStyles.BackgroundShapes}
                        style={[AppStyles.BackgroundShapesWH, AppStyles.column]}
                    >
                        <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                            <Image
                                style={[AppStyles.emptyIcon, AppStyles.centerSelf]}
                                source={Images.ImageAddAccount}
                            />
                        </View>
                        <View style={[AppStyles.flexEnd]}>
                            <Text style={[AppStyles.emptyText, AppStyles.baseText]}>
                                {Localize.t('account.addAccountDescription')}
                            </Text>
                            <View style={[AppStyles.centerAligned, AppStyles.centerContent]}>
                                <Button
                                    testID="account-generate-button"
                                    label={Localize.t('account.generateNewAccount')}
                                    onPress={this.goToGenerate}
                                />

                                <Spacer />

                                <Button
                                    testID="account-import-button"
                                    label={Localize.t('account.importExisting')}
                                    onPress={this.goToImport}
                                    style={[AppStyles.buttonBlueLight]}
                                    textStyle={[AppStyles.colorBlue]}
                                />

                                <View style={[styles.separatorContainer]}>
                                    <Text style={[styles.separatorText]}>{Localize.t('global.or')}</Text>
                                </View>

                                <Button
                                    style={AppStyles.buttonBlack}
                                    testID="account-import-button"
                                    label={Localize.t('account.addTangemCard')}
                                    onPress={this.onAddTangemCardPress}
                                />
                            </View>
                        </View>
                    </ImageBackground>
                </View>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default AccountAddView;
