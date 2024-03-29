/**
 * TokenIcon
 *
    <TokenIcon asset={} />
 *
 */
import React, { PureComponent } from 'react';
import { Image, ImageStyle, View, ViewStyle } from 'react-native';

import { NetworkService } from '@services';

import { TrustLineModel } from '@store/models';

import { AppSizes } from '@theme';
/* Types ==================================================================== */
interface Props {
    token: TrustLineModel | 'Native';
    size?: number;
    containerStyle?: ViewStyle | ViewStyle[];
    style?: ImageStyle | ImageStyle[];
}

interface State {
    icon: string;
}

/* Component ==================================================================== */
class TokenIcon extends PureComponent<Props, State> {
    static defaultProps = {
        size: 12,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            icon: undefined,
        };
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State): Partial<State> {
        const icon = TokenIcon.getIcon(nextProps.token);
        if (prevState.icon !== icon) {
            return {
                icon,
            };
        }
        return null;
    }

    static getIcon = (token: TrustLineModel | 'Native'): string => {
        if (!token) {
            return '';
        }

        // native
        if (token === 'Native') {
            const { currency } = NetworkService.getNativeAssetIcons();
            return currency;
        }

        return token.currency?.avatar;
    };

    render() {
        const { size, style, containerStyle } = this.props;
        const { icon } = this.state;

        return (
            <View style={containerStyle}>
                <Image
                    style={[{ width: AppSizes.scale(size), height: AppSizes.scale(size) }, style]}
                    source={{ uri: icon }}
                />
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default TokenIcon;
