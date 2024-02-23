import React, { PureComponent } from 'react';
import { View } from 'react-native';

import { Avatar } from '@components/General';

import styles from './styles';
/* Types ==================================================================== */
import { Props } from './types';

interface IProps extends Pick<Props, 'participant'> {}
/* Component ==================================================================== */
class AvatarBlock extends PureComponent<IProps> {
    render() {
        const { participant } = this.props;

        return (
            <View style={styles.avatarContainer}>
                <Avatar
                    badge={participant?.kycApproved ? 'IconCheckXaman' : undefined}
                    border
                    source={{ uri: `https://xumm.app/avatar/${participant?.address}_180_50.png` }}
                    isLoading={!participant}
                />
            </View>
        );
    }
}

export default AvatarBlock;
