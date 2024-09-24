import { isEqual } from 'lodash';
import React, { Component } from 'react';
import { View, ViewStyle } from 'react-native';

import { XAppItem } from '@components/Modules/XAppShortList/XAppItem';

import styles from './styles';
/* Types ==================================================================== */
interface Props {
    size: number;
    apps?: any[];
    onAppPress?: (item: any) => void;
    containerStyle?: ViewStyle | ViewStyle[];
}

interface State {
    apps: any[];
}

/* Component ==================================================================== */
class XAppShortList extends Component<Props, State> {
    static defaultProps = {
        size: 4,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            apps: Array.isArray(props.apps)
                ? Array.from({ length: props.size }, (v, k) => props.apps[k] || {})
                : Array(props.size).fill(undefined),
        };
    }

    shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>): boolean {
        const { apps } = this.state;
        return !isEqual(nextState.apps, apps);
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State): Partial<State> {
        if (Array.isArray(nextProps.apps) && !isEqual(prevState.apps, nextProps.apps)) {
            return {
                apps: Array.from({ length: nextProps.size }, (v, k) => nextProps.apps[k] || {}),
            };
        }
        return null;
    }

    render() {
        const { containerStyle, onAppPress } = this.props;
        const { apps } = this.state;

        return (
            <View style={[styles.container, containerStyle]}>
                {apps.map((app, index) => (
                    <XAppItem key={index} app={app} onPress={onAppPress} />
                ))}
            </View>
        );
    }
}

export default XAppShortList;
