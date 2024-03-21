import React, { Component } from 'react';
import { Animated, View, Text, ViewStyle, LayoutChangeEvent, TextStyle } from 'react-native';

import { TouchableDebounce } from '@components/General/TouchableDebounce';
import { Icon } from '@components/General/Icon';

import styles from './styles';

/* Types ==================================================================== */
interface Props {
    children: React.ReactNode;
    title: string;
    titleStyle: TextStyle | TextStyle[];
    expanded?: boolean;
    containerStyle?: ViewStyle | ViewStyle[];
    contentContainerStyle?: ViewStyle | ViewStyle[];
}

interface State {
    expanded: boolean;
    contentHeight?: number;
}

/* Component ==================================================================== */
class ExpandableView extends Component<Props, State> {
    private readonly animatedContainer: Animated.Value;

    declare readonly props: Props & Required<Pick<Props, keyof typeof ExpandableView.defaultProps>>;

    static defaultProps: Partial<Props> = {
        expanded: false,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            expanded: props.expanded ?? false,
            contentHeight: undefined,
        };

        this.animatedContainer = new Animated.Value(props.expanded ? 1 : 0);
    }

    setContentHeight = (event: LayoutChangeEvent) => {
        const { contentHeight } = this.state;
        const { height } = event.nativeEvent.layout;

        if (height === 0 || contentHeight) return;

        this.setState({ contentHeight: height });
    };

    toggleExpand = () => {
        const { expanded } = this.state;

        Animated.timing(this.animatedContainer, {
            toValue: expanded ? 0 : 1,
            duration: 300,
            useNativeDriver: false,
        }).start(() => {
            this.setState({
                expanded: !expanded,
            });
        });
    };

    render() {
        const { children, title, titleStyle, containerStyle, contentContainerStyle } = this.props;
        const { expanded } = this.state;

        const maxHeightInterpolate = this.animatedContainer.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1000],
        });

        const opacityInterpolate = this.animatedContainer.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
        });

        return (
            <View style={[styles.container, containerStyle]}>
                <View style={styles.titleContainer}>
                    <Text style={titleStyle}>{title}</Text>
                </View>
                <Animated.View
                    onLayout={this.setContentHeight}
                    style={[
                        styles.contentContainer,
                        contentContainerStyle,
                        { maxHeight: maxHeightInterpolate, opacity: opacityInterpolate },
                    ]}
                >
                    {children}
                </Animated.View>
                <TouchableDebounce style={styles.footerContainer} onPress={this.toggleExpand}>
                    <Icon name={expanded ? 'IconChevronUp' : 'IconChevronDown'} size={20} style={styles.expandIcon} />
                </TouchableDebounce>
            </View>
        );
    }
}

export default ExpandableView;
