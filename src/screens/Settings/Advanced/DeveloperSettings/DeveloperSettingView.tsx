/**
 * Developer settings Screen
 */

import React, { Component } from 'react';
import { View, Text, ScrollView } from 'react-native';

import { Navigator } from '@common/helpers/navigator';

import { AppScreens } from '@common/constants';

import { Header, InfoMessage, Switch, TouchableDebounce } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';
import Preferences from '@common/libs/preferences';
import ResolverService from '@services/ResolverService';
import { Toast } from '@common/helpers/interface';

/* types ==================================================================== */
export interface Props {}

export interface State {
    experimentalSimplicityUI: boolean;
}
/* Component ==================================================================== */
class DeveloperSettingView extends Component<Props, State> {
    static screenName = AppScreens.Settings.DeveloperSettings;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);
        this.state = {
            experimentalSimplicityUI: false,
        };
    }

    componentDidMount() {
        Preferences.get(Preferences.keys.EXPERIMENTAL_SIMPLICITY_UI).then((value) => {
            this.setState({
                experimentalSimplicityUI: value === 'true',
            });
        });
    }

    onExperimentalUIChangeRequest = (enable: boolean) => {
        Preferences.set(Preferences.keys.EXPERIMENTAL_SIMPLICITY_UI, `${enable}`).then(() => {
            this.setState({
                experimentalSimplicityUI: enable,
            });
        });
    };

    clearResolverCache = () => {
        ResolverService.clearCache().then(() => {
            Toast(Localize.t('settings.cacheClearedSuccessfully'));
        });
    };

    render() {
        const { experimentalSimplicityUI } = this.state;

        return (
            <View testID="developer-settings-view" style={styles.container}>
                <Header
                    centerComponent={{ text: Localize.t('settings.developerSettings') }}
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: Navigator.pop,
                    }}
                />
                <ScrollView>
                    <Text numberOfLines={1} style={styles.descriptionText}>
                        {Localize.t('settings.experimental')}
                    </Text>
                    <View style={styles.row}>
                        <View style={AppStyles.flex3}>
                            <Text numberOfLines={1} style={styles.label}>
                                {Localize.t('settings.experimentalSimplicityUi')}
                            </Text>
                        </View>
                        <View style={[AppStyles.rightAligned, AppStyles.flex1]}>
                            <Switch checked={experimentalSimplicityUI} onChange={this.onExperimentalUIChangeRequest} />
                        </View>
                    </View>

                    <Text numberOfLines={1} style={styles.descriptionText}>
                        {Localize.t('settings.cache')}
                    </Text>
                    <TouchableDebounce style={styles.row} onPress={this.clearResolverCache}>
                        <View style={AppStyles.flex3}>
                            <Text numberOfLines={1} style={styles.label}>
                                {Localize.t('settings.clearResolverCache')}
                            </Text>
                        </View>
                    </TouchableDebounce>

                    <InfoMessage
                        label={Localize.t('settings.restartRequired')}
                        type="error"
                        containerStyle={AppStyles.marginSml}
                    />
                </ScrollView>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default DeveloperSettingView;
