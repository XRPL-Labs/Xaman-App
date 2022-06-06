import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

import { TouchableDebounce, Icon, InfoMessage } from '@components/General';

import Localize from '@locale';

import { AppStyles } from '@theme';
import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import styles from './styles';

/* Component ==================================================================== */
class ListEmpty extends PureComponent {
    openTrustLineDescription = () => {
        Navigator.showModal(AppScreens.Modal.Help, {
            title: Localize.t('home.whatAreOtherAssets'),
            content: Localize.t('home.otherAssetsDesc'),
        });
    };

    render() {
        return (
            <View testID="tokens-list-empty-view" style={[styles.container]}>
                <InfoMessage type="warning" label={Localize.t('home.youDonNotHaveOtherAssets')} />
                <TouchableDebounce
                    style={[AppStyles.row, AppStyles.centerContent, AppStyles.paddingSml]}
                    onPress={this.openTrustLineDescription}
                >
                    <Icon name="IconInfo" size={20} style={[styles.trustLineInfoIcon]} />
                    <Text style={[AppStyles.subtext, AppStyles.textCenterAligned, AppStyles.link, AppStyles.colorGrey]}>
                        {Localize.t('home.whatAreOtherAssets')}
                    </Text>
                </TouchableDebounce>
            </View>
        );
    }
}

export default ListEmpty;
