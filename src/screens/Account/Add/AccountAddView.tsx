/**
 * Add Account Screen
 */

import React, { Component } from 'react';
import { View, Text, Image, ImageBackground } from 'react-native';

import { Navigator } from '@common/helpers/navigator';
import { Images } from '@common/helpers/images';
import { AppScreens } from '@common/constants';

// components
import { Button, Header } from '@components';

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

    goToImport = () => {
        Navigator.push(AppScreens.Account.Import);
    };

    goToGenerate = () => {
        Navigator.push(AppScreens.Account.Generate);
    };

    render() {
        return (
            <View testID="account-add-view" style={[AppStyles.pageContainerFull]}>
                <Header
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        // iconSize: 22,
                        // text: Localize.t('global.back'),
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
                                    style={[AppStyles.buttonBlueLight]}
                                    textStyle={[AppStyles.colorBlue]}
                                />
                                <View style={[styles.separatorContainer]}>
                                    <Text style={[styles.separatorText]}>{Localize.t('global.or')}</Text>
                                </View>
                                <Button
                                    testID="account-import-button"
                                    label={Localize.t('account.importExisting')}
                                    onPress={this.goToImport}
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
