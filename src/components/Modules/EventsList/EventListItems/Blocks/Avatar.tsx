import React, { PureComponent } from 'react';
import { View } from 'react-native';

import { WebLinks } from '@common/constants/endpoints';

import { InstanceTypes } from '@common/libs/ledger/types/enums';

import StyleService from '@services/StyleService';

import { Avatar } from '@components/General';
import { Props as AvatarProps } from '@components/General/Avatar/Avatar';

import styles from './styles';
/* Types ==================================================================== */
import { Props } from './types';

interface IProps extends Pick<Props, 'participant' | 'item'> {}
/* Component ==================================================================== */
class AvatarBlock extends PureComponent<IProps> {
    getBadgeProps = (): Pick<AvatarProps, 'badge' | 'badgeColor'> | undefined => {
        const { item, participant } = this.props;

        if (participant?.kycApproved) {
            return {
                badge: 'IconCheckXaman',
            };
        }

        if (item?.InstanceType === InstanceTypes.FallbackTransaction) {
            return {
                badge: 'IconFlaskConical',
                badgeColor: StyleService.value('$orange'),
            };
        }

        return undefined;
    };

    render() {
        const { participant } = this.props;

        // get badge props
        const badgeProps = this.getBadgeProps();

        return (
            <View style={styles.avatarContainer}>
                <Avatar
                    // border
                    source={{ uri: `${WebLinks.AvatarURL}/${participant?.address}_180_50.png` }}
                    isLoading={!participant}
                    badge={badgeProps?.badge}
                    badgeColor={badgeProps?.badgeColor}
                />
            </View>
        );
    }
}

export default AvatarBlock;
