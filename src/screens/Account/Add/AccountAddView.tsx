/**
 * Add Account Screen
 */

import React, { Component } from 'react';
import { View, Text, Image, ImageBackground, Alert } from 'react-native';

import RNTangemSdk from 'tangem-sdk-react-native';

import { Navigator } from '@common/helpers/navigator';
import { Images } from '@common/helpers/images';
import { AppScreens } from '@common/constants';

// components
import { Button, Header, Spacer } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {}

/* Component ==================================================================== */
class AccountAddView extends Component<Props, State> {
    static screenName = AppScreens.Account.Add;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    goToImport = (props?: any) => {
        Navigator.push(AppScreens.Account.Import, {}, props);
    };

    goToGenerate = () => {
        Navigator.push(AppScreens.Account.Generate);
    };

    scanTangemCard = () => {
        RNTangemSdk.scanCard()
            .then((card) => {
                const { cardData } = card;

                if (cardData.blockchainName === 'XRP') {
                    this.goToImport({ tangemCard: card });
                } else {
                    Alert.alert(Localize.t('global.error'), Localize.t('account.scannedCardIsNotATangemXRPCard'));
                }
            })
            .catch(() => {
                // ignore
            });
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
                                    label={Localize.t('account.importTangemCard')}
                                    onPress={this.scanTangemCard}
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
