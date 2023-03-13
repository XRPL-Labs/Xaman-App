import React, { PureComponent } from 'react';
import { View } from 'react-native';

import { InfoMessage } from '@components/General';

import Localize from '@locale';

import styles from './styles';

/* Component ==================================================================== */
class ListEmpty extends PureComponent {
    render() {
        return (
            <View testID="tokens-list-empty-view" style={[styles.container]}>
                <InfoMessage type="warning" label={Localize.t('home.youDonNotHaveNFTokens')} />
            </View>
        );
    }
}

export default ListEmpty;
