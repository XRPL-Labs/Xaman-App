import React, { PureComponent } from 'react';
import { View, Text, InteractionManager } from 'react-native';

import { ProfileRepository } from '@store/repositories';

import { Icon } from '@components/General';

import styles from './styles';

/* Types ==================================================================== */
interface Props {}

interface State {
    hasPro: boolean;
}

/* Component ==================================================================== */
class ProBadge extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            hasPro: false,
        };
    }

    componentDidMount() {
        // get the has pro status
        InteractionManager.runAfterInteractions(this.getProStatus);

        // update the badge visibility when updated
        ProfileRepository.on('profileUpdate', this.getProStatus);
    }

    componentWillUnmount() {
        ProfileRepository.off('profileUpdate', this.getProStatus);
    }

    getProStatus = () => {
        const profile = ProfileRepository.getProfile();

        // no profile found
        if (!profile) {
            return;
        }

        this.setState({
            hasPro: profile.hasPro,
        });
    };

    render() {
        const { hasPro } = this.state;

        if (!hasPro) {
            return null;
        }

        return (
            <View style={styles.proBadgeContainer}>
                <Icon name="IconPro" size={15} />
                <Text style={styles.proBadgeLabel}>Pro</Text>
            </View>
        );
    }
}

export default ProBadge;
