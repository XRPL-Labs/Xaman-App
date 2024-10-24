import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

import NetworkService from '@services/NetworkService';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import { TouchableDebounce, Icon, InfoMessage } from '@components/General';

import Localize from '@locale';

import { HelpModalProps } from '@screens/Modal/Help';

import { AppStyles } from '@theme';
import styles from './styles';

/* Component ==================================================================== */
class ListEmpty extends PureComponent {
    openTrustLineDescription = () => {
        Navigator.showModal<HelpModalProps>(AppScreens.Modal.Help, {
            title: Localize.t('home.whatAreOtherAssets', { nativeAsset: NetworkService.getNativeAsset() }),
            content: Localize.t('home.otherAssetsDesc', {
                nativeAsset: NetworkService.getNativeAsset(),
                network: NetworkService.getNetwork().name,
            }),
        });
    };

    render() {
        return (
            <View testID="tokens-list-empty-view" style={styles.container}>
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
                    <Text style={[AppStyles.subtext, AppStyles.textCenterAligned, AppStyles.link, AppStyles.colorGrey]}>
                        {Localize.t('home.whatAreOtherAssets', { nativeAsset: NetworkService.getNativeAsset() })}
                    </Text>
                </TouchableDebounce>
            </View>
        );
    }
}

export default ListEmpty;
