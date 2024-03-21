/**
 * TokenIcon
 *
    <TokenIcon  />
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
    icon?: string;
}

/* Component ==================================================================== */
class TokenIcon extends PureComponent<Props, State> {
    declare readonly props: Props & Required<Pick<Props, keyof typeof TokenIcon.defaultProps>>;

    static defaultProps: Partial<Props> = {
        size: 12,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            icon: undefined,
        };
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State): Partial<State> | null {
        const icon = TokenIcon.getIcon(nextProps.token);
        if (icon && prevState.icon !== icon) {
            return {
                icon,
            };
        }
        return null;
    }

    static getIcon = (token: TrustLineModel | 'Native'): string | undefined => {
        if (!token) {
            return undefined;
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

        if (!icon) {
            return null;
        }

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
