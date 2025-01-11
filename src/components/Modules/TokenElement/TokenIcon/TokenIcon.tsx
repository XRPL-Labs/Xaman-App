/**
 * TokenIcon
 *
    <TokenIcon  />
 *
 */
import React, { PureComponent } from 'react';
import { Image, ImageStyle, View, ViewStyle } from 'react-native';

import { NetworkService, StyleService } from '@services';

import { TrustLineModel } from '@store/models';

import { AppSizes } from '@theme';
/* Types ==================================================================== */
interface Props {
    token: TrustLineModel | 'Native';
    size?: number;
    saturate?: boolean;
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
        if (prevState.icon !== icon) {
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

        return token.currency?.avatarUrl;
    };

    render() {
        const { saturate, size, style, containerStyle } = this.props;
        const { icon } = this.state;

        if (!icon) {
            return null;
        }

        let iconUrl = icon;
        if (iconUrl && saturate) {
            const BASE_CDN_URL = '/cdn-cgi/image/';
            const SATURATION_PARAM = `saturation=0,background=${StyleService.value('$background').replace('#', '%23')},`;

            if (iconUrl) {
                iconUrl = iconUrl.replace(BASE_CDN_URL, `${BASE_CDN_URL}${SATURATION_PARAM}`);
            }
        }

        return (
            <View style={containerStyle}>
                <Image
                    style={[{ width: AppSizes.scale(size), height: AppSizes.scale(size) }, style]}
                    source={{ uri: iconUrl }}
                />
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default TokenIcon;
