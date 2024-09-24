/**
 * ThirdParty apps List Screen
 */

import React, { Component } from 'react';
import { View, Text, FlatList, ImageBackground, InteractionManager, RefreshControl } from 'react-native';
import { Navigation, EventSubscription } from 'react-native-navigation';

import BackendService from '@services/BackendService';
import StyleService from '@services/StyleService';

import { AppScreens } from '@common/constants';
import { Navigator } from '@common/helpers/navigator';

import { TouchableDebounce, Header, Avatar, Icon, Spacer } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export type ThirdPartyAppType = {
    app: {
        id: string;
        name: string;
        description: string;
        icon: string;
    };
    urls: {
        homepage?: string;
        terms?: string;
        support?: string;
        privacy?: string;
    };
    grant: {
        validity: number;
        issued: string;
        expires: string;
    };
    report?: string;
};

export interface Props {}

export interface State {
    isLoading: boolean;
    thirdPartyApps: ThirdPartyAppType[];
}

/* Component ==================================================================== */
class ThirdPartyAppsView extends Component<Props, State> {
    static screenName = AppScreens.Settings.ThirdPartyApps.List;
    private navigationListener: EventSubscription;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            thirdPartyApps: [],
        };
    }

    componentDidMount() {
        // listen for screen appear event
        this.navigationListener = Navigation.events().bindComponent(this);
    }

    componentWillUnmount() {
        // remove listeners
        if (this.navigationListener) {
            this.navigationListener.remove();
        }
    }

    componentDidAppear() {
        InteractionManager.runAfterInteractions(this.fetchThirdPartyApps);
    }

    fetchThirdPartyApps = () => {
        BackendService.getThirdPartyApps()
            .then((thirdPartyApps: ThirdPartyAppType[]) => {
                if (Array.isArray(thirdPartyApps)) {
                    this.setState({
                        thirdPartyApps,
                    });
                } else {
                    this.setState({
                        thirdPartyApps: [],
                    });
                }
            })
            .catch(() => {
                // ignore
            })
            .finally(() => {
                this.setState({
                    isLoading: false,
                });
            });
    };

    onItemPress = (item: ThirdPartyAppType) => {
        Navigator.push(AppScreens.Settings.ThirdPartyApps.Edit, { thirdPartyApp: item });
    };

    renderItem = ({ item }: { item: ThirdPartyAppType }) => {
        const { app } = item;

        return (
            <TouchableDebounce
                onPress={() => {
                    this.onItemPress(item);
                }}
                style={styles.rowContainer}
            >
                <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                    <Avatar size={35} source={{ uri: app.icon }} />
                </View>
                <View style={[AppStyles.flex4, AppStyles.centerContent]}>
                    <Text numberOfLines={1} style={styles.rowLabel}>
                        {app.name}
                    </Text>
                </View>
                <View style={[AppStyles.flex1, AppStyles.rightAligned]}>
                    <Icon size={25} name="IconChevronRight" style={styles.rowIcon} />
                </View>
            </TouchableDebounce>
        );
    };

    renderSeparator = () => {
        return <View style={styles.hr} />;
    };

    renderEmpty = () => {
        const { isLoading } = this.state;

        if (isLoading) {
            return null;
        }

        return (
            <ImageBackground
                source={StyleService.getImage('BackgroundShapes')}
                imageStyle={AppStyles.BackgroundShapes}
                style={[AppStyles.flex1, AppStyles.centerContent]}
            >
                <View style={[AppStyles.centerAligned, AppStyles.paddingSml]}>
                    <Icon size={130} name="IconInfo" style={{ tintColor: StyleService.value('$silver') }} />
                    <Spacer size={50} />
                    <Text style={[AppStyles.pbold, AppStyles.textCenterAligned]}>
                        {Localize.t('settings.noAuthorizedThirdPartyApp')}
                    </Text>
                    <Spacer />
                    <Text style={[AppStyles.subtext, AppStyles.textCenterAligned]}>
                        {Localize.t('settings.onceYouAuthorizedAppYouWillSeeItHere')}
                    </Text>
                </View>
            </ImageBackground>
        );
    };

    render() {
        const { thirdPartyApps, isLoading } = this.state;

        return (
            <View testID="third-party-apps-view" style={styles.container}>
                <Header
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: Navigator.pop,
                    }}
                    centerComponent={{ text: Localize.t('settings.thirdPartyApps') }}
                />
                <FlatList
                    style={[AppStyles.flex1, AppStyles.stretchSelf]}
                    contentContainerStyle={styles.scrollContainer}
                    data={thirdPartyApps}
                    refreshing={isLoading}
                    renderItem={this.renderItem}
                    ListEmptyComponent={this.renderEmpty}
                    ItemSeparatorComponent={this.renderSeparator}
                    indicatorStyle={StyleService.isDarkMode() ? 'white' : 'default'}
                    refreshControl={
                        <RefreshControl
                            onRefresh={this.fetchThirdPartyApps}
                            refreshing={isLoading}
                            tintColor={StyleService.value('$contrast')}
                        />
                    }
                />
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default ThirdPartyAppsView;
