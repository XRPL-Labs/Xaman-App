import React, { Component } from 'react';
import { requireNativeComponent, ViewStyle } from 'react-native';

const NativeBlurView: any = requireNativeComponent('BlurView');

/* Types ==================================================================== */
interface Props {
    children: React.ReactNode;
    blurType?: 'xlight' | 'light' | 'dark';
    blurAmount?: number;
    style?: ViewStyle | ViewStyle[];
}

/* Component ==================================================================== */
class BlurView extends Component<Props> {
    render() {
        const { blurType, blurAmount, style, children } = this.props;
        return (
            <NativeBlurView blurType={blurType} blurAmount={blurAmount} style={style}>
                {children}
            </NativeBlurView>
        );
    }
}

export default BlurView;
