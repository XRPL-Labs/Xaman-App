import React, { PureComponent } from 'react';
import { View, Text, FlatList, TouchableOpacity, ViewStyle } from 'react-native';

import { AppScreens } from '@common/constants';

import { Navigator } from '@common/helpers/navigator';

import { AccountSchema, TrustLineSchema } from '@store/schemas/latest';

import Localize from '@locale';

import { InfoMessage, Icon, Button } from '@components/General';
import { TrustLineItem } from '@components/Modules/TrustLineList/TrustLineItem';

import { AppStyles } from '@theme';

import styles from './styles';
/* Types ==================================================================== */
interface Props {
    testID?: string;
    style: ViewStyle | ViewStyle[];
    account: AccountSchema;
    onLinePress: (line: TrustLineSchema) => void;
    discreetMode: boolean;
    showAddButton: boolean;
}

/* Component ==================================================================== */
class TrustLineList extends PureComponent<Props> {
    onPress = (line: TrustLineSchema) => {
        const { onLinePress } = this.props;

        if (onLinePress && typeof onLinePress === 'function') {
            onLinePress(line);
        }
    };

    openTrustLineDescription = () => {
        Navigator.showModal(
            AppScreens.Modal.Help,
            {},
            {
                title: Localize.t('home.whatAreOtherAssets'),
                content: Localize.t('home.otherAssetsDesc'),
            },
        );
    };

    openAddCurrency = () => {
        const { account } = this.props;

        Navigator.showOverlay(
            AppScreens.Overlay.AddCurrency,
            {
                layout: {
                    backgroundColor: 'transparent',
                    componentBackgroundColor: 'transparent',
                },
            },
            { account },
        );
    };

    renderEmptyList = () => {
        return (
            <View testID="assets-empty-view" style={[styles.noTrustlineMessage]}>
                <InfoMessage type="warning" label={Localize.t('home.youDonNotHaveOtherAssets')} />
                <TouchableOpacity
                    style={[AppStyles.row, AppStyles.centerContent, AppStyles.paddingSml]}
                    onPress={this.openTrustLineDescription}
                >
                    <Icon name="IconInfo" size={20} style={[styles.trustLineInfoIcon]} />
                    <Text style={[AppStyles.subtext, AppStyles.textCenterAligned, AppStyles.link, AppStyles.colorGrey]}>
                        {Localize.t('home.whatAreOtherAssets')}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    renderHeader = () => {
        const { showAddButton } = this.props;

        return (
            <View style={[AppStyles.row, AppStyles.centerContent, styles.headerContainer]}>
                <View style={[AppStyles.flex5, AppStyles.centerContent]}>
                    <Text numberOfLines={1} style={[AppStyles.pbold]}>
                        {Localize.t('home.otherAssets')}
                    </Text>
                </View>
                {showAddButton && (
                    <View style={[AppStyles.flex5]}>
                        <Button
                            light
                            roundedSmall
                            numberOfLines={1}
                            testID="add-asset-button"
                            label={Localize.t('home.addAsset')}
                            onPress={this.openAddCurrency}
                            icon="IconPlus"
                            iconSize={20}
                            style={[AppStyles.rightSelf]}
                        />
                    </View>
                )}
            </View>
        );
    };

    renderItem = ({ item }: { item: TrustLineSchema }) => {
        const { account, discreetMode } = this.props;

        return (
            <TrustLineItem
                line={item}
                selfIssued={item.currency.issuer === account.address}
                onPress={this.onPress}
                discreetMode={discreetMode}
            />
        );
    };

    render() {
        const { account, testID, style } = this.props;

        return (
            <FlatList
                testID={testID}
                data={account.lines}
                renderItem={this.renderItem}
                ListHeaderComponent={this.renderHeader}
                ListEmptyComponent={this.renderEmptyList}
                keyExtractor={(item, index) => `${item.currency.issuer}-${index}`}
                style={style}
                stickyHeaderIndices={[0]}
                // bounces={false}
            />
        );
    }
}

export default TrustLineList;
