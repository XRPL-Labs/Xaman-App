import React, { PureComponent } from 'react';
import { View } from 'react-native';

import { Button, PillButton } from '@components/General';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';
import { ASSETS_CATEGORY } from '@screens/Overlay/SwitchAssetCategory/types';
import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';
import { AssetListFilterProps } from '@screens/Overlay/AssetListFilter';
import { FiltersType } from '../ListFilter';

/* Types ==================================================================== */
interface Props {
    reorderEnabled: boolean;
    showTokenAddButton: boolean;
    onTokenAddPress: () => void;
    onReorderSavePress: () => void;
    onTitlePress: (selectedCategory?: ASSETS_CATEGORY) => void;
    hideTopElements: (toggle: boolean) => void;
    filters?: FiltersType;
    visible: boolean;
    onFilterChange: (filters: FiltersType | undefined) => void;
    onReorderPress: () => void;
}

// interface State {
//     category:
// }

/* Component ==================================================================== */
class ListHeader extends PureComponent<Props> {
    onAddPress = () => {
        const { onTokenAddPress } = this.props;

        if (typeof onTokenAddPress === 'function') {
            onTokenAddPress();
        }
    };

    onReorderSavePress = () => {
        const { onReorderSavePress } = this.props;

        if (typeof onReorderSavePress === 'function') {
            onReorderSavePress();
        }
    };

    onTitlePress = (selectedCategory?: ASSETS_CATEGORY) => {
        const { onTitlePress } = this.props;

        if (typeof onTitlePress === 'function') {
            onTitlePress(selectedCategory);
        }
    };

    tokenListSettingsPress = () => {
        const {
            filters,
            visible,
            onFilterChange,
            onReorderPress,
            onTokenAddPress,
            onReorderSavePress,
            hideTopElements,
        } = this.props;

        hideTopElements(true);

        Navigator.showOverlay<AssetListFilterProps>(AppScreens.Overlay.AssetListFilter, {
            //
            filters,
            visible,
            onFilterChange,
            onReorderPress,
            onTokenAddPress,
            onReorderSavePress,
            hideTopElements,
            onAddTokenPress: () => { 
                hideTopElements(false);
                this.onAddPress();
            },
        });
    };

    renderButtons = () => {
        const { showTokenAddButton, reorderEnabled, filters } = this.props;

        if (reorderEnabled) {
            return (
                <View
                    style={[
                        styles.rightButtonContainer,
                    ]}
                >
                    <Button
                        roundedMini
                        numberOfLines={1}
                        testID="reorder-save-button"
                        label={Localize.t('global.save')}
                        onPress={this.onReorderSavePress}
                        icon="IconCheck"
                        iconSize={19}
                        style={[
                            AppStyles.alignSelfStretch,
                            styles.listHeaderButton,
                        ]}
                    />
                </View>
            );
        }

        if (showTokenAddButton) {
            return (
                <View
                    style={[
                        styles.rightButtonContainer,
                    ]}
                >
                    <Button
                        light
                        roundedMini
                        numberOfLines={1}
                        testID="add-token-button"
                        label={Localize.t('home.addAsset')}
                        onPress={this.onAddPress}
                        icon="IconPlus"
                        iconSize={19}
                        style={[
                            AppStyles.alignSelfStretch,
                            styles.listHeaderButton,
                            styles.addTokenButton,
                        ]}
                    />
                    { filters && (filters.favorite || filters.hideZero || String(filters.text) !== '') && (
                        <View style={styles.filterActive} />
                    )}
                    <Button
                        light
                        roundedMini
                        numberOfLines={1}
                        testID="token-list-settings-button"
                        onPress={this.tokenListSettingsPress}
                        iconSize={23}
                        icon="IconMoreHorizontal"
                        style={[
                            AppStyles.alignSelfStretch,
                            styles.listHeaderButton,
                            styles.listOptionsButton,
                        ]}
                    />
                </View>
            );
        }

        return null;
    };

    // renderTitle = () => {
    //     return (
    //         <TouchableDebounce
    //             style={[AppStyles.row, AppStyles.flex5, AppStyles.centerAligned]}
    //             onPress={this.onTitlePress}
    //         >
    //             <Text numberOfLines={1} style={styles.tokenText}>
    //                 {Localize.t('global.assets')}
    //             </Text>
    //             <Icon name="IconChevronDown" size={22} style={styles.pickerIcon} />
    //         </TouchableDebounce>
    //     );
    // };

    render() {
        return (
            <View style={[
                styles.container,
            ]}>
                <PillButton
                    style={[
                    ]}
                    active='TOKENS'
                    items={[
                        {
                            id: 'TOKENS',
                            label: Localize.t('global.assets'),
                            onActivate: () => {
                                this.onTitlePress(ASSETS_CATEGORY.Tokens);
                            },
                        },
                        {
                            id: 'NFT',
                            label: Localize.t('global.nfts'),
                            onActivate: () => {
                                this.onTitlePress(ASSETS_CATEGORY.NFTs);
                            },
                        },
                    ]}
                />
                <View style={[
                    AppStyles.alignSelfStretch,
                ]}>
                    {this.renderButtons()}
                </View>
            </View>
        );
    }
}

export default ListHeader;
