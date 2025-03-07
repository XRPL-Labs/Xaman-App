import React, { PureComponent } from 'react';
import { View, Text, InteractionManager, ViewStyle } from 'react-native';

import { ProfileRepository } from '@store/repositories';

import { Icon } from '@components/General';

import styles from './styles';

/* Types ==================================================================== */
interface Props {
    hasPro?: number;
    style?: ViewStyle | ViewStyle[];
}

interface State {
    hasPro: boolean;
    hasProFromProps: boolean;
}

/* Component ==================================================================== */
class ProBadge extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        const { hasPro } = this.props;

        const hasProFromProps = typeof hasPro === 'number';

        this.state = {
            hasPro: hasProFromProps
                ? hasPro > 0
                : false,
            hasProFromProps,
        };
    }

    componentDidMount() {
        // get the has pro status
        const { hasProFromProps } = this.state;

        if (!hasProFromProps) {
            InteractionManager.runAfterInteractions(this.getProStatus);

            // update the badge visibility when updated
            ProfileRepository.on('profileUpdate', this.getProStatus);
        }
    }

    componentWillUnmount() {
        const { hasProFromProps } = this.state;

        if (!hasProFromProps) {
            ProfileRepository.off('profileUpdate', this.getProStatus);
        }
    }

    getProStatus = () => {
        const { hasProFromProps } = this.state;
        
        if (hasProFromProps) {
            return;
        }

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
        const { style } = this.props;
        const { hasPro } = this.state;

        if (!hasPro) {
            return null;
        }

        return (
            <View style={[
                styles.proBadgeContainer,
                style,
            ]}>
                <Icon name="IconPro" size={15} />
                <Text style={styles.proBadgeLabel}>Pro</Text>
            </View>
        );
    }
}

export default ProBadge;
