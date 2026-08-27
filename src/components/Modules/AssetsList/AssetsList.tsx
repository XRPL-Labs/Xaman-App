import React, { Component } from 'react';
import { ViewStyle } from 'react-native';

import { AccountModel, NetworkModel } from '@store/models';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import { ASSETS_CATEGORY, Props as SwitchAssetCategoryOverlayProps } from '@screens/Overlay/SwitchAssetCategory/types';

import { TokensList } from './Tokens';
import { NFTsList } from './NFTs';
import { VibrateHapticFeedback } from '@common/helpers/interface';
import BackendService from '@services/BackendService';

/* Types ==================================================================== */

interface Props {
    timestamp?: number;
    style: ViewStyle | ViewStyle[];
    account: AccountModel;
    discreetMode: boolean;
    spendable: boolean;
    experimentalUI?: boolean;
    network?: NetworkModel;
    addTokenPress?: () => void;
    hapticFeedback: boolean;
    hideTopElements: (toggle: boolean) => void;
}

interface State {
    account: string;
    category: ASSETS_CATEGORY;
}

/* Component ==================================================================== */
class AssetsList extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            account: props.account?.address,
            category: ASSETS_CATEGORY.Tokens,
        };
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State) {
        if (nextProps.account?.address !== prevState.account) {
            return {
                category: ASSETS_CATEGORY.Tokens,
                account: nextProps.account?.address,
            };
        }
        return null;
    }

    onAssetCategoryChange = (selectedCategory: ASSETS_CATEGORY) => {
        const { category } = this.state;

        if (selectedCategory !== category) {
            setTimeout(() => BackendService.action('assetcatswitch', selectedCategory), 1000);
            this.setState({
                category: selectedCategory,
            });
        }
    };

    onChangeCategoryPress = (selectedCategory?: ASSETS_CATEGORY) => {
        const { category } = this.state;
        const { hapticFeedback } = this.props;

        if (!selectedCategory) {
            return Navigator.showOverlay<SwitchAssetCategoryOverlayProps>(AppScreens.Overlay.SwitchAssetCategory, {
                selected: category,
                onSelect: this.onAssetCategoryChange,
            });
        }

        if (hapticFeedback) {
            VibrateHapticFeedback('impactMedium');
        }
        return this.onAssetCategoryChange(selectedCategory);
    };

    render() {
        const {
            style,
            timestamp,
            discreetMode,
            spendable,
            experimentalUI,
            account,
            network,
            addTokenPress,
            hideTopElements,
        } = this.props;
        const { category } = this.state;

        let AssetListComponent;

        switch (category) {
            case ASSETS_CATEGORY.Tokens:
                AssetListComponent = TokensList;
                break;
            case ASSETS_CATEGORY.NFTs:
                AssetListComponent = NFTsList;
                break;
            default:
                return null;
        }

        return (
            <AssetListComponent
                key={`${AssetListComponent.name}_${timestamp}`}
                account={account}
                network={network}
                discreetMode={discreetMode}
                spendable={spendable}
                hideTopElements={hideTopElements}
                onChangeCategoryPress={this.onChangeCategoryPress}
                addTokenPress={addTokenPress}
                style={style}
                experimentalUI={experimentalUI}
            />
        );
    }
}

export default AssetsList;
