import React, { Component } from 'react';
import { ViewStyle } from 'react-native';

import { AccountModel, NetworkModel } from '@store/models';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import { ASSETS_CATEGORY, Props as SwitchAssetCategoryOverlayProps } from '@screens/Overlay/SwitchAssetCategory/types';

import { TokensList } from './Tokens';
import { NFTsList } from './NFTs';

/* Types ==================================================================== */

interface Props {
    timestamp?: number;
    style: ViewStyle | ViewStyle[];
    account: AccountModel;
    discreetMode: boolean;
    spendable: boolean;
    experimentalUI?: boolean;
    network?: NetworkModel;
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
            this.setState({
                category: selectedCategory,
            });
        }
    };

    onChangeCategoryPress = () => {
        const { category } = this.state;

        Navigator.showOverlay<SwitchAssetCategoryOverlayProps>(AppScreens.Overlay.SwitchAssetCategory, {
            selected: category,
            onSelect: this.onAssetCategoryChange,
        });
    };

    render() {
        const { style, timestamp, discreetMode, spendable, experimentalUI, account, network } = this.props;
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
                onChangeCategoryPress={this.onChangeCategoryPress}
                style={style}
                experimentalUI={experimentalUI}
            />
        );
    }
}

export default AssetsList;
