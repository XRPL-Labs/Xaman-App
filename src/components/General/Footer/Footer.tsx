/**
 * Footer
 *
    <Footer></Footer>
 *
 */
import React, { PureComponent, ReactNode } from 'react';

import { View, ViewStyle } from 'react-native';

import { HasBottomNotch } from '@common/helpers/device';

import { AppSizes } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    children: ReactNode;
    style?: ViewStyle | ViewStyle[];
    safeArea?: boolean;
    hidden?: boolean;
}

interface State {
    hidden: boolean;
}

/* Component ==================================================================== */
class Footer extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            hidden: props.hidden,
        };
    }

    hide = () => {
        this.setState({
            hidden: true,
        });
    };

    show = () => {
        this.setState({
            hidden: false,
        });
    };

    render() {
        const { children, style, safeArea } = this.props;
        const { hidden } = this.state;

        if (hidden) {
            return null;
        }

        return (
            <View
                style={[
                    styles.container,
                    { paddingBottom: safeArea && (HasBottomNotch() ? 34 : 10) + AppSizes.paddingExtraSml },
                    style,
                ]}
            >
                {children}
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default Footer;
