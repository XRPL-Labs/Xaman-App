/**
 * CountDown component
 *
    <CountDown seconds={10} />
 *
 */
import React, { PureComponent } from 'react';

import { Animated, InteractionManager, Text, TextStyle } from 'react-native';

/* Types ==================================================================== */
export interface Props {
    seconds: number;
    preFix?: string;
    postFix?: string;
    style: TextStyle | TextStyle[];
    onFinish?: () => void;
}

interface State {
    current: number;
}

/* Component ==================================================================== */
class CountDown extends PureComponent<Props, State> {
    private _isMounted: boolean;

    private countDownAnimated: Animated.Value;

    constructor(props: Props) {
        super(props);

        this.state = {
            current: props.seconds,
        };

        this._isMounted = false;
        this.countDownAnimated = new Animated.Value(props.seconds);
        this.countDownAnimated.addListener(this.onValueChange);
    }
    componentDidMount() {
        this._isMounted = true;
        InteractionManager.runAfterInteractions(this.startCountDown);
    }

    componentWillUnmount() {
        this._isMounted = false;
        this.countDownAnimated.removeAllListeners();
    }

    onValueChange = ({ value }: { value: number }) => {
        const { current } = this.state;

        if (!this._isMounted) {
            return;
        }

        const fixed = Math.floor(value) + 1;

        if (fixed !== current) {
            this.setState({
                current: fixed,
            });
        }
    };

    startCountDown = () => {
        const { onFinish, seconds } = this.props;

        Animated.timing(this.countDownAnimated, { toValue: 0, duration: seconds * 1000, useNativeDriver: true }).start(
            () => {
                if (typeof onFinish === 'function') {
                    onFinish();
                }
            },
        );
    };

    render() {
        const { style, preFix, postFix } = this.props;
        const { current } = this.state;

        return (
            <Text style={style}>
                {preFix} {current}
                {postFix}
            </Text>
        );
    }
}

/* Export Component ==================================================================== */
export default CountDown;
