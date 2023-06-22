/**
 * Token Avatar
 *
    <TokenAvatar token={} />
 *
 */
import React, { PureComponent } from 'react';

import { StyleService } from '@services';
import { TrustLineSchema } from '@store/schemas/latest';

import { Avatar, AvatarProps } from '@components/General/Avatar';

/* Types ==================================================================== */
interface Props extends Omit<AvatarProps, 'source'> {
    token: TrustLineSchema | string;
}

interface State {
    avatar: string;
}

/* Component ==================================================================== */
class TokenAvatar extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            avatar: undefined,
        };
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State): Partial<State> {
        const avatar = TokenAvatar.getAvatar(nextProps.token);
        if (prevState.avatar !== avatar) {
            return {
                avatar,
            };
        }
        return null;
    }

    static getAvatar = (token: TrustLineSchema | string): string => {
        if (!token) {
            return '';
        }

        // native
        if (typeof token === 'string') {
            return StyleService.getImage('IconXrpSquare').uri;
        }

        // IOU
        const { counterParty } = token;

        if (counterParty.avatar) {
            return counterParty.avatar;
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
