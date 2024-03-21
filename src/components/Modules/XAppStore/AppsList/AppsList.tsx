import React, { Component } from 'react';
import { RefreshControl, SectionList, Text, View, ViewStyle } from 'react-native';

import StyleService from '@services/StyleService';

import { HorizontalLine } from '@components/General';
import { AppActions, AppItem } from '@components/Modules/XAppStore/AppsList/AppItem';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    dataSource: any;
    onAppPress: (app: any) => void;
    visible: boolean;
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

    renderItem = ({ item }: { item: XamanBackend.AppCategory }): React.ReactElement => {
        return <AppItem item={item} onPress={this.onAppPress} action={AppActions.OPEN_ABOUT} />;
    };

    renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => {
        if (!title) {
            return null;
        }
        return (
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{title}</Text>
            </View>
        );
    };

    renderSeparator = ({ leadingItem, trailingSection }: { leadingItem: any; trailingSection: any }) => {
        if (!leadingItem || !trailingSection) {
            return null;
        }
        return <HorizontalLine />;
    };

    render() {
        const { dataSource, refreshing, visible, containerStyle } = this.props;

        if (!visible) {
            return null;
        }

        return (
            <SectionList
                style={containerStyle}
                sections={dataSource ?? []}
                renderItem={this.renderItem}
                keyExtractor={(item: XamanBackend.AppCategory, index) => `${item?.identifier}${index}`}
                renderSectionHeader={this.renderSectionHeader}
                ListEmptyComponent={this.renderEmpty}
                SectionSeparatorComponent={this.renderSeparator}
                stickySectionHeadersEnabled
                refreshControl={
                    <RefreshControl
                        refreshing={!!refreshing}
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
