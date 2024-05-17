/**
 * Switch asset category Modal
 */

import React, { Component } from 'react';
import { Animated, Text, View } from 'react-native';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

// components
import { Button, Spacer, Icon, TouchableDebounce } from '@components/General';
import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
import { ASSETS_CATEGORY, Props, State } from './types';

/* Component ==================================================================== */
class SwitchAssetCategoryOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.SwitchAssetCategory;

    private animatedColor: Animated.Value;
    private animatedOpacity: Animated.Value;

    static options() {
        return {
            topBar: {
                visible: false,
            },
        };
    }

    constructor(props: Props) {
        super(props);

        this.animatedColor = new Animated.Value(0);
        this.animatedOpacity = new Animated.Value(1);
    }

    componentDidMount() {
        Animated.timing(this.animatedColor, {
            toValue: 150,
            duration: 350,
            useNativeDriver: false,
        }).start();
    }

    dismiss = () => {
        Animated.parallel([
            Animated.timing(this.animatedOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(this.animatedColor, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
            }),
        ]).start(() => {
            Navigator.dismissOverlay();
        });
    };

    onAssetPress = (asset: ASSETS_CATEGORY) => {
        const { onSelect } = this.props;

        if (typeof onSelect === 'function') {
            onSelect(asset);
        }

        this.dismiss();
    };

    render() {
        const { selected } = this.props;

        const interpolateColor = this.animatedColor.interpolate({
            inputRange: [0, 150],
            outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)'],
        });

        return (
            <Animated.View style={[styles.container, { backgroundColor: interpolateColor }]}>
                <Animated.View style={[styles.visibleContent, { opacity: this.animatedOpacity }]}>
                    <View style={[AppStyles.row, AppStyles.centerAligned]}>
                        <View style={[AppStyles.flex1, AppStyles.paddingLeftSml, AppStyles.centerAligned]}>
                            <Text style={[AppStyles.p, AppStyles.bold]}>{Localize.t('global.select')}</Text>
                        </View>
                        <TouchableDebounce activeOpacity={0.8} onPress={this.dismiss}>
                            <Icon name="IconX" size={20} style={styles.closeIcon} />
                        </TouchableDebounce>
                    </View>
                    <View style={styles.buttonsContainer}>
                        <Button
                            light
                            label={Localize.t('global.assets')}
                            style={selected === ASSETS_CATEGORY.Tokens ? styles.selectedButton : {}}
                            /* eslint-disable-next-line react/jsx-no-bind */
                            onPress={this.onAssetPress.bind(null, ASSETS_CATEGORY.Tokens)}
                        />
                        <Spacer />
                        <Button
                            light
                            label={Localize.t('global.nfts')}
                            style={selected === ASSETS_CATEGORY.NFTs ? styles.selectedButton : {}}
                            /* eslint-disable-next-line react/jsx-no-bind */
                            onPress={this.onAssetPress.bind(null, ASSETS_CATEGORY.NFTs)}
                        />
                    </View>
                </Animated.View>
            </Animated.View>
        );
    }
}

/* Export Component ==================================================================== */
export default SwitchAssetCategoryOverlay;
