import { isEqual } from 'lodash';
import React, { Component } from 'react';
import { InteractionManager, View, ViewStyle } from 'react-native';

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
    declare readonly props: Props & Required<Pick<Props, keyof typeof XAppShortList.defaultProps>>;

    static defaultProps: Partial<Props> = {
        size: 4,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            apps: [],
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.setInitApps);
    }

    shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>): boolean {
        const { apps } = this.state;
        return !isEqual(nextState.apps, apps);
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State): Partial<State> | null {
        if (nextProps.apps && Array.isArray(nextProps.apps) && !isEqual(prevState.apps, nextProps.apps)) {
            return {
                apps: Array.from({ length: nextProps.size }, (v, k) => nextProps.apps![k] || {}),
            };
        }
        return null;
    }

    setInitApps = () => {
        const { apps, size } = this.props;

        let initApps = Array(size).fill(undefined);

        if (apps && Array.isArray(apps)) {
            initApps = Array.from({ length: size }, (v, k) => apps[k] || {});
        }

        this.setState({
            apps: initApps,
        });
    };

    render() {
        const { containerStyle, onAppPress } = this.props;
        const { apps } = this.state;

        return (
            <View style={[styles.container, containerStyle]}>
                {apps.map((app, index) => (
                    <XAppItem key={index} app={app} index={index} onPress={onAppPress} />
                ))}
            </View>
        );
    }
}

export default XAppShortList;
