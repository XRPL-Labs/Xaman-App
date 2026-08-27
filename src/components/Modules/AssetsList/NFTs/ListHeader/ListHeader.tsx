import React, { PureComponent } from 'react';
import { View } from 'react-native';

import { PillButton } from '@components/General';

import Localize from '@locale';

// import { AppStyles } from '@theme';
import styles from './styles';
import { ASSETS_CATEGORY } from '@screens/Overlay/SwitchAssetCategory/types';

/* Types ==================================================================== */
interface Props {
    onTitlePress: (selectedCategory?: ASSETS_CATEGORY) => void;
}

/* Component ==================================================================== */
class ListHeader extends PureComponent<Props> {
    onTitlePress = (selectedCategory?: ASSETS_CATEGORY) => {
        const { onTitlePress } = this.props;

        if (typeof onTitlePress === 'function') {
            onTitlePress(selectedCategory);
        }
    };

    // renderTitle = () => {
    //     return (
    //         <TouchableDebounce
    //             style={[AppStyles.row, AppStyles.flex5, AppStyles.centerAligned]}
    //             onPress={this.onTitlePress}
    //         >
    //             <Text numberOfLines={1} style={styles.tokenText}>
    //                 {Localize.t('global.nfts')}
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
                    active='NFT'
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
                {/* <View style={[
                    AppStyles.alignSelfStretch,
                ]}>{this.renderButtons()}</View> */}
            </View>
        );
    }
}

export default ListHeader;
