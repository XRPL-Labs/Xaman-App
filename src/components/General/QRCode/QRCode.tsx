import React, { Component } from 'react';
import { requireNativeComponent, ViewStyle } from 'react-native';

const NativeQRCode: any = requireNativeComponent('QRCode');

/* Types ==================================================================== */
interface Props {
    value: string;
    size?: number;
    style?: ViewStyle;
    foregroundColor?: string;
    backgroundColor?: string;
}

/* Component ==================================================================== */
class QRCode extends Component<Props> {
    render() {
        const { backgroundColor, foregroundColor, value, size, style } = this.props;
        return (
            <NativeQRCode
                bgColor={backgroundColor}
                fgColor={foregroundColor}
                value={value}
                style={{ width: size, height: size, ...style }}
            />
        );
    }
}

export default QRCode;
