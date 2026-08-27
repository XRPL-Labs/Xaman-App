/**
 * Footer
 *
    <Footer></Footer>
 *
 */
import React, { PureComponent, ReactNode } from 'react';

import { Platform, StyleSheet, View, ViewStyle } from 'react-native';

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
            hidden: !!props.hidden,
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

        const flattened = StyleSheet.flatten([
            styles.container,
            { paddingBottom: safeArea ? (HasBottomNotch() ? 34 : 10) + AppSizes.paddingExtraSml : undefined },
            style,
        ]) as ViewStyle;

        // Home-button / iPhone SE: SafeAreaView bottom inset is 0, so keep a 20pt gap.
        const minBottom = Platform.OS === 'ios' && !HasBottomNotch() ? AppSizes.paddingSml : 0;
        if (minBottom && (Number(flattened.paddingBottom) || 0) < minBottom) {
            flattened.paddingBottom = minBottom;
        }

        return <View style={flattened}>{children}</View>;
    }
}

/* Export Component ==================================================================== */
export default Footer;
