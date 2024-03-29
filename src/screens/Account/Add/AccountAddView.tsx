/**
 * Add Account Screen
 */
import { get, set, isEmpty } from 'lodash';

import React, { Component } from 'react';
import { View, Text, Image, ImageBackground, Alert, InteractionManager, EventSubscription } from 'react-native';

import RNTangemSdk, { Card, EventCallback } from 'tangem-sdk-react-native';

import { utils } from 'xrpl-accountlib';

import StyleService from '@services/StyleService';
import LoggerService from '@services/LoggerService';

import { AccountRepository } from '@store/repositories';

import { Navigator } from '@common/helpers/navigator';
import { Prompt } from '@common/helpers/interface';

import { GetPreferCurve, GetWalletDerivedPublicKey, DefaultDerivationPaths } from '@common/utils/tangem';

import { AppScreens } from '@common/constants';

// components
import { Button, Header, Spacer } from '@components/General';

import Localize from '@locale';

import { Props as AccountGenerateViewProps } from '@screens/Account/Add/Generate/types';
import { Props as AccountImportViewProps } from '@screens/Account/Add/Import/types';

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

    private nfcChangeListener?: EventSubscription;

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
            this.nfcChangeListener = RNTangemSdk.addListener('NFCStateChange', this.onNFCStateChange);

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
        if (this.nfcChangeListener) {
            this.nfcChangeListener.remove();
        }

        RNTangemSdk.stopSession().catch(() => {
            // ignore
        });
    }

    onNFCStateChange = ({ enabled }: EventCallback) => {
        this.setState({
            NFCEnabled: enabled,
        });
    };

    goToImport = (props: AccountImportViewProps = {}) => {
        Navigator.push<AccountImportViewProps>(AppScreens.Account.Import, props);
    };

    goToGenerate = () => {
        Navigator.push<AccountGenerateViewProps>(AppScreens.Account.Generate, {});
    };

    validateAndImportCard = (card: Card) => {
        try {
            // get normalized public key from card data
            const publicKey = GetWalletDerivedPublicKey(card);

            // validate wallet publicKey by deriving the address before moving to the next step
            const address = utils.deriveAddress(publicKey);
            if (!address || !utils.isValidAddress(address)) {
                throw new Error('generated wallet contains invalid wallet publicKey!');
            }

            // check if account exist
            const exist = AccountRepository.findOne({ address });
            if (exist) {
                Alert.alert(Localize.t('global.error'), Localize.t('account.accountAlreadyExist', { address }));
                return;
            }

            this.goToImport({ tangemCard: card });
        } catch (e) {
            LoggerService.recordError('Unexpected error in importing tangem wallet', e);
            Alert.alert(
                Localize.t('global.unexpectedErrorOccurred'),
                Localize.t('global.pleaseCheckSessionLogForMoreInfo'),
            );
        }
    };

    createTangemWallet = async (card: Card) => {
        const { cardId, supportedCurves } = card;

        try {
            const resp = await RNTangemSdk.createWallet({ cardId, curve: GetPreferCurve(supportedCurves) });

            // validate response
            const { wallet } = resp;

            if (!resp || !wallet) {
                throw new Error('No wallet present in createWallet response!');
            }

            // apply generated wallet to the scanned card
            set(card, 'wallets', [wallet]);

            // validate created card is apply to the card object
            if (!get(card, 'wallets[0].publicKey')) {
                throw new Error('Unable to set newly generated wallet to the card details!');
            }

            // go to import section
            this.validateAndImportCard(card);
        } catch (error: any) {
            // ignore use cancel operation
            if (error?.message && error?.message === 'The user cancelled the operation') {
                return;
            }
            LoggerService.recordError('Unexpected error in creating tangem wallet', error);
            Alert.alert(
                Localize.t('global.unexpectedErrorOccurred'),
                Localize.t('global.pleaseCheckSessionLogForMoreInfo'),
            );
        }
    };

    scanTangemCard = async () => {
        try {
            const card = await RNTangemSdk.scanCard();

            // get current card wallets status
            const { wallets } = card;

            if (!card || !Array.isArray(wallets)) {
                throw new Error('response is not contain card details or wallet details');
            }

            // card already contains existing wallet
            if (!isEmpty(wallets)) {
                this.validateAndImportCard(card);
                return;
            }

            // no wallet exist in the card
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
        } catch (error: any) {
            if (error?.message && error?.message === 'The user cancelled the operation') {
                return;
            }
            LoggerService.recordError('Unexpected error in scanning tangem card', error);
            Alert.alert(
                Localize.t('global.unexpectedErrorOccurred'),
                Localize.t('global.pleaseCheckSessionLogForMoreInfo'),
            );
        }
    };

    onAddTangemCardPress = async () => {
        const { NFCSupported, NFCEnabled } = this.state;

        if (!NFCSupported) {
            Alert.alert(Localize.t('global.error'), Localize.t('account.tangemNFCNotSupportedDeviceAlert'));
            return;
        }

        // start the NFC/Tangem session
        RNTangemSdk.startSession({
            attestationMode: 'offline',
            defaultDerivationPaths: DefaultDerivationPaths,
        }).catch((e) => {
            LoggerService.recordError('Unexpected error TangemSDK startSession', e);
        });

        if (NFCEnabled) {
            await this.scanTangemCard();
        }
    };

    render() {
        return (
            <View testID="account-add-screen" style={AppStyles.container}>
                <Header
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: Navigator.pop,
                    }}
                    centerComponent={{ text: Localize.t('account.addAccount') }}
                />
                <View style={[AppStyles.contentContainer, AppStyles.paddingHorizontal, AppStyles.paddingBottom]}>
                    <ImageBackground
                        source={StyleService.getImage('BackgroundShapes')}
                        imageStyle={AppStyles.BackgroundShapes}
                        style={[AppStyles.BackgroundShapesWH, AppStyles.column]}
                    >
                        <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                            <Image
                                style={[AppStyles.emptyIcon, AppStyles.centerSelf]}
                                source={StyleService.getImage('ImageAddAccount')}
                            />
                        </View>
                        <View style={AppStyles.flexEnd}>
                            <Text style={[AppStyles.emptyText, AppStyles.baseText]}>
                                {Localize.t('account.addAccountDescription')}
                            </Text>
                            <View style={[AppStyles.centerAligned, AppStyles.centerContent]}>
                                <Button
                                    numberOfLines={1}
                                    testID="account-generate-button"
                                    label={Localize.t('account.generateNewAccount')}
                                    onPress={this.goToGenerate}
                                />

                                <Spacer />

                                <Button
                                    secondary
                                    numberOfLines={1}
                                    testID="account-import-button"
                                    label={Localize.t('account.importExisting')}
                                    onPress={this.goToImport}
                                />

                                <View style={styles.separatorContainer}>
                                    <Text style={styles.separatorText}>{Localize.t('global.or')}</Text>
                                </View>

                                <Button
                                    contrast
                                    testID="tangem-import-button"
                                    label={Localize.t('account.addTangemCard')}
                                    onPress={this.onAddTangemCardPress}
                                    style={{ backgroundColor: StyleService.value('$contrast') }}
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
