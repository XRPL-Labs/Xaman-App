import React, { PureComponent } from 'react';
import { Text, View } from 'react-native';

import NetworkService from '@services/NetworkService';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

// import { TouchableDebounce, Icon, InfoMessage } from '@components/General';
import { Button, Icon, InfoMessage, TouchableDebounce } from '@components/General';

import Localize from '@locale';

import { HelpModalProps } from '@screens/Modal/Help';

import { AppStyles } from '@theme';
import styles from './styles';
import StyleService from '@services/StyleService';

interface Props {
    onTokenAddButtonPress: () => void;
}

/* Component ==================================================================== */
class ListEmpty extends PureComponent<Props> {
    openTrustLineDescription = () => {
        Navigator.showModal<HelpModalProps>(AppScreens.Modal.Help, {
            title: Localize.t('home.whatAreOtherAssets', { nativeAsset: NetworkService.getNativeAsset() }),
            content: Localize.t('home.otherAssetsDesc', { nativeAsset: NetworkService.getNativeAsset() }),
        });
    };

    render() {
        const { onTokenAddButtonPress } = this.props;

        return (
            <View testID="tokens-list-empty-view" style={styles.container}>
                {onTokenAddButtonPress && (
                    <Button
                        nonBlock
                        style={[AppStyles.buttonBlueLight]}
                        onPress={onTokenAddButtonPress}
                        textStyle={StyleService.isDarkMode() ? AppStyles.colorWhite : AppStyles.colorBlue}
                        iconStyle={StyleService.isDarkMode() ? AppStyles.imgColorWhite : AppStyles.imgColorBlue}
                        label={Localize.t('asset.addFirstAsset')}
                        icon="IconPlus"
                        iconSize={25}
                    />
                )}

                {!onTokenAddButtonPress && (
                    <>
                        <InfoMessage
                            type="warning"
                            label={Localize.t('home.youDonNotHaveOtherAssets', {
                                nativeAsset: NetworkService.getNativeAsset(),
                            })}
                        />
                        <TouchableDebounce
                            style={[AppStyles.row, AppStyles.centerContent, AppStyles.paddingSml]}
                            onPress={this.openTrustLineDescription}
                        >
                            <Icon name="IconInfo" size={20} style={[styles.trustLineInfoIcon]} />
                            <Text style={[
                                AppStyles.subtext, AppStyles.textCenterAligned, AppStyles.link, AppStyles.colorGrey,
                            ]}>
                                {Localize.t('home.whatAreOtherAssets', {
                                    nativeAsset: NetworkService.getNativeAsset(),
                                })}
                            </Text>
                        </TouchableDebounce>
                        </>
                )}
            </View>
        );
    }
}

export default ListEmpty;
