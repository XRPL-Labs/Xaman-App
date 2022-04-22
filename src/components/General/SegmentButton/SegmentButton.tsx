import React, { PureComponent } from 'react';
import { Text, View, ViewStyle } from 'react-native';

import { TouchableDebounce } from '@components/General/TouchableDebounce';

import styles from './styles';
/* Types ==================================================================== */
interface State {
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
            selectedIndex: props.selectedIndex,
        };
    }

    onButtonPress = (index: number) => {
        const { onPress } = this.props;

        this.setState({
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
                    <TouchableDebounce
                        activeOpacity={0.6}
                        onPress={() => {
                            this.onButtonPress(i);
                        }}
                        key={i}
                        style={[styles.button, selectedIndex === i && styles.selectedButton]}
                    >
                        <View style={[styles.textContainer]}>
                            <Text
                                numberOfLines={1}
                                style={[styles.buttonText, selectedIndex === i && styles.selectedButtonText]}
                            >
                                {button}
                            </Text>
                        </View>
                    </TouchableDebounce>
                ))}
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default SegmentButton;
