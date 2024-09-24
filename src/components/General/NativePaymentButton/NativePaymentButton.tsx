import { debounce } from 'lodash';

import React, { PureComponent } from 'react';

import { HostComponent, requireNativeComponent, ViewStyle, StyleProp } from 'react-native';

import { LoadingIndicator } from '@components/General/LoadingIndicator';

import { AppSizes } from '@theme';

import styles from './styles';
import StyleService from '@services/StyleService';
/* Types ==================================================================== */
interface Props {
    buttonStyle?: 'light' | 'dark';
    testID?: string;
    onPress?: () => void;
    isLoading?: boolean;
    style?: StyleProp<ViewStyle> | undefined;
}

/* Native ==================================================================== */
const NativePayButton: HostComponent<Props & { height: number }> = requireNativeComponent('NativePayButton');

/* Component ==================================================================== */
export default class NativePaymentButton extends PureComponent<Props> {
    debouncedOnPress = () => {
        const { onPress, isLoading } = this.props;

        if (isLoading) {
            return;
        }

        if (typeof onPress === 'function') {
            onPress();
        }
    };

    onPress = debounce(this.debouncedOnPress, 500, { leading: true, trailing: false });

    render() {
        const { buttonStyle, testID, style, isLoading } = this.props;
        return (
            <>
                <NativePayButton
                    buttonStyle={buttonStyle ?? StyleService.isDarkMode() ? 'light' : 'dark'}
                    height={AppSizes.scale(37)}
                    testID={testID}
                    onPress={this.onPress}
                    style={[style, isLoading ? styles.payButtonLoading : {}]}
                />
                <LoadingIndicator color="light" style={styles.loadingIndicator} animating={isLoading} />
            </>
        );
    }
}
