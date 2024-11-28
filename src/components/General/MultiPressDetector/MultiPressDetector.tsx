/**
 * MultiPressDetector
 *
    <MultiPressDetector pressThreshold={3} />
 *
 */
import React, { PureComponent, PropsWithChildren } from 'react';

import { TouchableOpacity } from 'react-native';

/* Types ==================================================================== */
export interface Props extends PropsWithChildren {
    pressThreshold?: number;
    onMultiPress?: () => void;
}

export interface State {
    pressCount: number;
    lastPress: number;
}

/* Component ==================================================================== */
class MultiPressDetector extends PureComponent<Props, State> {
    declare readonly props: Props & Required<Pick<Props, keyof typeof MultiPressDetector.defaultProps>>;

    static defaultProps: Partial<Props> = {
        pressThreshold: 3,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            pressCount: 0,
            lastPress: 0,
        };
    }

    handleButtonPress = () => {
        const { pressCount, lastPress } = this.state;
        const { pressThreshold } = this.props;

        const currentTime = Date.now();
        const timeDifference = currentTime - lastPress;

        if (timeDifference < 500) {
            this.setState(
                {
                    pressCount: pressCount + 1,
                    lastPress: currentTime,
                },
                () => {
                    const { pressCount: newPressCount } = this.state;
                    if (newPressCount === pressThreshold) {
                        this.executeCallback();
                        this.resetPressCount();
                    }
                },
            );
        } else {
            this.resetPressCount(currentTime);
        }
    };

    resetPressCount = (currentTime = 0) => {
        this.setState({
            pressCount: 0,
            lastPress: currentTime,
        });
    };

    executeCallback = () => {
        const { onMultiPress } = this.props;

        // Call your callback function here
        if (typeof onMultiPress === 'function') {
            onMultiPress();
        }
    };

    render() {
        const { children } = this.props;

        return (
            <TouchableOpacity
                hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
                activeOpacity={1}
                onPress={this.handleButtonPress}
            >
                {children}
            </TouchableOpacity>
        );
    }
}

/* Export Component ==================================================================== */
export default MultiPressDetector;
