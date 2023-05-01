import React, { Component } from 'react';
import { FlatList, RefreshControl, Text, View, ViewStyle } from 'react-native';

import StyleService from '@services/StyleService';

import { AppItem } from '@components/Modules/XAppStore/AppsList/AppItem';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';
/* Types ==================================================================== */
interface Props {
    dataSource: any;
    onAppPress: (app: any) => void;
    onRefresh?: () => void;

    refreshing?: boolean;

    searching?: boolean;
    containerStyle: ViewStyle | ViewStyle[];
}

interface State {}
/* Component ==================================================================== */
class AppsList extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    onAppPress = (app: any) => {
        const { onAppPress } = this.props;

        if (typeof onAppPress === 'function') {
            onAppPress(app);
        }
    };

    onRefresh = () => {
        const { onRefresh } = this.props;

        if (typeof onRefresh === 'function') {
            onRefresh();
        }
    };

    renderSeparator = () => {
        return <View style={styles.hr} />;
    };

    renderEmpty = () => {
        const { searching } = this.props;

        // if we are searching return null
        if (searching) {
            return null;
        }

        return (
            <View style={styles.listEmptyContainer}>
                <Text style={AppStyles.pbold}>{Localize.t('global.noInformationToShow')}</Text>
            </View>
        );
    };

    renderItem = ({ item }: { item: any }): React.ReactElement => {
        return <AppItem item={item} onPress={this.onAppPress} />;
    };

    render() {
        const { dataSource, refreshing, containerStyle } = this.props;

        return (
            <FlatList
                contentContainerStyle={containerStyle}
                data={dataSource}
                renderItem={this.renderItem}
                ItemSeparatorComponent={this.renderSeparator}
                ListEmptyComponent={this.renderEmpty}
                style={styles.sectionList}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={this.onRefresh}
                        tintColor={StyleService.value('$contrast')}
                    />
                }
                indicatorStyle={StyleService.isDarkMode() ? 'white' : 'default'}
            />
        );
    }
}

export default AppsList;
