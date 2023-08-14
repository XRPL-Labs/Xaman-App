import React, { PureComponent } from 'react';
import { View, ViewStyle } from 'react-native';

import { Button } from '@components/General/Button';

import styles from './styles';
/* Types ==================================================================== */
interface State {
    ownUpdate: boolean;
    selectedIndex: number;
}

interface Props {
    buttons: Array<string>;
    selectedIndex?: number;
    containerStyle?: ViewStyle;
    onPress: (index: number) => void;
}

/* Component ==================================================================== */
class SegmentButton extends PureComponent<Props, State> {
    static defaultProps = {
        selectedIndex: 0,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            ownUpdate: false,
            selectedIndex: props.selectedIndex,
        };
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State): Partial<State> {
        if (prevState.ownUpdate) {
            return {
                ownUpdate: false,
            };
        }

        if (nextProps.selectedIndex !== prevState.selectedIndex) {
            return {
                selectedIndex: nextProps.selectedIndex,
            };
        }

        return null;
    }

    onButtonPress = (index: number) => {
        const { onPress } = this.props;

        this.setState({
            ownUpdate: true,
            selectedIndex: index,
        });

        if (typeof onPress === 'function') {
            onPress(index);
        }
    };

    render() {
        const { buttons, containerStyle } = this.props;
        const { selectedIndex } = this.state;

        return (
            <View style={[styles.container, containerStyle]}>
                {buttons.map((button, i) => (
                    <Button
                        key={`segment-button-${i}`}
                        light
                        roundedMini
                        contrast={selectedIndex === i}
                        label={button}
                        style={styles.button}
                        textStyle={[styles.buttonText, selectedIndex === i && styles.buttonTextSelected]}
                        // eslint-disable-next-line react/jsx-no-bind
                        onPress={this.onButtonPress.bind(null, i)}
                    />
                ))}
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default SegmentButton;
