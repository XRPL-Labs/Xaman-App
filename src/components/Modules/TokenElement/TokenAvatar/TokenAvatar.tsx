/**
 * Token Avatar
 *
    <TokenAvatar token={} />
 *
 */
import React, { PureComponent } from 'react';

import { NetworkService, StyleService } from '@services';

import { TrustLineModel } from '@store/models';

import { Avatar, AvatarProps } from '@components/General/Avatar';
import { View, Text } from 'react-native';
// import { AppStyles } from '@theme/index';
import styles from './styles';

/* Types ==================================================================== */
interface Props extends Omit<AvatarProps, 'source'> {
    token?: TrustLineModel | 'Native';
    tokenPair?: (TrustLineModel | string)[];
    saturate?: boolean;
    networkKey?: string;
    networkService?: typeof NetworkService;
}

interface State {
}

/* Component ==================================================================== */
class TokenAvatar extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);
    }

    getAvatar (): string {
        const {token, networkService} = this.props;

        if (token === 'Native') {
            return (networkService || NetworkService).getNativeAssetIcons().asset || '';
        }

        // issuer avatar
        if (typeof token === 'object' && token && token?.currency?.issuerAvatarUrl) {
            return token.currency.issuerAvatarUrl;
        }

        if (typeof token === 'object' && token && token?.isLiquidityPoolToken()) {
            return StyleService.getImage('ImageUnknownAMM').uri;
        }

        return StyleService.getImage('ImageUnknownTrustLine').uri;
    };

    render() {
        const {
            token,
            tokenPair,
            size,
            imageScale,
            border,
            badge,
            saturate,
            badgeColor,
            containerStyle,
            backgroundColor,
            networkService,
        } = this.props;

        // add saturation to avatar before passing it
        let avatarUrl = this.getAvatar();
        if (avatarUrl && saturate) {
            const BASE_CDN_URL = '/cdn-cgi/image/';
            const SATURATION_PARAM = 'saturation=0,';

            if (avatarUrl) {
                avatarUrl = avatarUrl.replace(BASE_CDN_URL, `${BASE_CDN_URL}${SATURATION_PARAM}`);
            }
        }
        
        const _containerStyle = containerStyle || { backgroundColor: 'transparent' };

        const nativeAsset = (networkService || NetworkService).getNativeAsset();

        const TokenPair = token
            ? typeof token !== 'string' && token.getLpAssetPair() || undefined
            : tokenPair && typeof tokenPair === 'object' && tokenPair.length === 2 ? tokenPair.map(_token => {
                return typeof _token === 'object' && _token?.currency?.issuerAvatarUrl
                    ? _token.currency.issuerAvatarUrl
                    : typeof _token === 'string' && _token === nativeAsset
                    ? _token
                    : StyleService.getImage('ImageUnknownTrustLine').uri;
            }) : undefined;

        if (TokenPair && TokenPair?.[0] && TokenPair?.[1] && TokenPair?.[0] !== '' && TokenPair?.[1] !== '') {
            const [t1, t2] = TokenPair;
            const img1 = t1 === nativeAsset
                ? (networkService || NetworkService).getNativeAssetIcons().asset
                : t1 === ''
                ? StyleService.getImage('ImageUnknownAMM').uri
                : t1;
            const img2 = t2 === nativeAsset
                ? (networkService || NetworkService).getNativeAssetIcons().asset
                : t1 === ''
                ? StyleService.getImage('ImageUnknownAMM').uri
                : t2;

            return (
                <View
                    style={[
                        styles.lpContainer,
                        { width: size, height: size },
                        containerStyle,
                        { backgroundColor },
                    ]}
                >
                    <Avatar
                        containerStyle={[
                            styles.miniAvatar,
                            styles.avatar1,
                        ]}
                        size={21} source={{ uri: img1 }} />
                    <Avatar
                        containerStyle={[
                            styles.miniAvatar,
                            styles.avatar2,
                        ]}
                        size={21} source={{ uri: img2 }} />
                </View>
            );
        }

        if (!avatarUrl || avatarUrl === '') {
            return <Text>?</Text>;
        }

        return (
            <Avatar
                {...
                    {
                        size,
                        imageScale,
                        border,
                        badge,
                        badgeColor,
                        containerStyle: _containerStyle,
                        backgroundColor,
                    }
                }
                source={{ uri: avatarUrl }}
            />
        );
    }
}

/* Export Component ==================================================================== */
export default TokenAvatar;
