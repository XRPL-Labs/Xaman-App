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

/* Types ==================================================================== */
interface Props extends Omit<AvatarProps, 'source'> {
    token: TrustLineModel | 'Native';
}

interface State {
    avatar?: string;
}

/* Component ==================================================================== */
class TokenAvatar extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            avatar: undefined,
        };
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State): Partial<State> | null {
        const avatar = TokenAvatar.getAvatar(nextProps.token);
        if (prevState.avatar !== avatar) {
            return {
                avatar,
            };
        }
        return null;
    }

    static getAvatar = (token: TrustLineModel | 'Native'): string => {
        // native asset
        if (token === 'Native') {
            const { asset } = NetworkService.getNativeAssetIcons();
            return asset;
        }

        // issuer avatar
        if (token?.currency?.issuerAvatarUrl) {
            return token.currency.issuerAvatarUrl;
        }

        if (token?.isLiquidityPoolToken()) {
            return StyleService.getImage('ImageUnknownAMM').uri;
        }

        return StyleService.getImage('ImageUnknownTrustLine').uri;
    };

    render() {
        const { size, imageScale, border, badge, badgeColor, containerStyle, backgroundColor } = this.props;
        const { avatar } = this.state;

        return (
            <Avatar
                {...{ size, imageScale, border, badge, badgeColor, containerStyle, backgroundColor }}
                source={{ uri: avatar }}
            />
        );
    }
}

/* Export Component ==================================================================== */
export default TokenAvatar;
