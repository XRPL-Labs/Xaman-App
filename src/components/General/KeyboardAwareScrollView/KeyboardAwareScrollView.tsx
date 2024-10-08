/* eslint-disable react/jsx-props-no-spreading */
import React, { ReactNode, PureComponent } from 'react';
import {
    ScrollView,
    Dimensions,
    ScrollViewProps,
    Animated,
    Platform,
    LayoutChangeEvent,
    TextInput,
} from 'react-native';

import Keyboard from '@common/helpers/keyboard';

import styles from './styles';
/* Types ==================================================================== */
interface Props extends ScrollViewProps {
    testID?: string;
    enabled?: boolean;
    children: ReactNode;
    hasHeader?: boolean;
    extraOffset?: number;
    calculateExtraOffset?: (input: any, inputHeight: number) => number;
    onKeyboardShow?: () => void;
    onKeyboardHide?: () => void;
}

interface State {
    offset: any;
}

const DEFAULT_EXTRA_OFFSET = 20;
/* Component ==================================================================== */
class KeyboardAwareScrollView extends PureComponent<Props, State> {
    private keyboardHeight: number;
    private windowHeight: number;
    private scrollPosition: any;
    private viewHeight: number;
    private contentHeight: number;
    private scrollViewRef: React.RefObject<ScrollView>;
    private scrollToTimeout: NodeJS.Timeout | undefined;

    declare readonly props: Props & Required<Pick<Props, keyof typeof KeyboardAwareScrollView.defaultProps>>;

    static defaultProps: Partial<Props> = {
        extraOffset: 0,
        enabled: true,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            offset: new Animated.Value(0),
        };

        this.scrollViewRef = React.createRef();

        this.keyboardHeight = 0;
        this.viewHeight = 0;
        this.contentHeight = 0;
        this.windowHeight = Dimensions.get('window').height;

        this.scrollPosition = { x: 0, y: 0 };
    }

    componentDidMount() {
        Keyboard.addListener('keyboardWillShow', this.onKeyboardShow);
        Keyboard.addListener('keyboardWillHide', this.onKeyboardHide);
    }

    componentWillUnmount() {
        // clear timeout
        if (this.scrollToTimeout) clearTimeout(this.scrollToTimeout);

        Keyboard.removeListener('keyboardWillShow', this.onKeyboardShow);
        Keyboard.removeListener('keyboardWillHide', this.onKeyboardHide);
    }

    public scrollTo = (y: number) => {
        this.scrollViewRef?.current?.scrollTo({ y });
    };

    measureElement = (element: any): Promise<any> => {
        return new Promise((resolve: any) => {
            element.measureInWindow((x: number, y: number, width: number, height: number) => {
                resolve({ x, y, width, height });
            });
        });
    };

    scrollToFocusedTextInput = async () => {
        const { extraOffset, calculateExtraOffset } = this.props;
        const { offset } = this.state;

        const currentlyFocusedField = TextInput.State.currentlyFocusedInput();
        const responder = this.scrollViewRef?.current?.getScrollResponder();

        if (!currentlyFocusedField || !responder) {
            return;
        }

        const { y: scrollViewY } = await this.measureElement(this.scrollViewRef.current);
        const { y: inputY, height: inputHeight } = await this.measureElement(currentlyFocusedField);

        const keyboardPosition = Math.abs(this.keyboardHeight - this.windowHeight);
        let textInputBottomPosition = inputY + inputHeight;

        if (typeof calculateExtraOffset === 'function') {
            textInputBottomPosition += calculateExtraOffset(currentlyFocusedField, inputHeight);
        }

        // need to push content to up
        if (textInputBottomPosition > keyboardPosition) {
            let bottomOffset = textInputBottomPosition - keyboardPosition + inputHeight;

            if (scrollViewY) {
                bottomOffset += scrollViewY;
            }

            bottomOffset += extraOffset;

            Animated.timing(offset, {
                toValue: bottomOffset + inputHeight,
                useNativeDriver: false,
                duration: 200,
            }).start(() => {
                this.scrollToTimeout = setTimeout(() => {
                    this.scrollViewRef?.current?.scrollTo({
                        x: 0,
                        y: this.scrollPosition.y + textInputBottomPosition - keyboardPosition + DEFAULT_EXTRA_OFFSET,
                        animated: true,
                    });
                }, 10);
            });
        }
    };

    onKeyboardShow = (event: any) => {
        const { onKeyboardShow, enabled } = this.props;

        const { height } = event.endCoordinates;

        this.keyboardHeight = height;

        if (typeof onKeyboardShow === 'function') {
            onKeyboardShow();
        }

        if (enabled) {
            this.scrollToFocusedTextInput();
        }
    };

    onKeyboardHide = () => {
        const { onKeyboardHide, enabled } = this.props;
        const { offset } = this.state;

        if (typeof onKeyboardHide === 'function') {
            onKeyboardHide();
        }

        if (enabled) {
            Animated.timing(offset, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false,
            }).start();
        }
    };

    handleLayout = (event: LayoutChangeEvent) => {
        const { onLayout } = this.props;

        this.viewHeight = event.nativeEvent.layout.height;

        if (typeof onLayout === 'function') {
            onLayout(event);
        }
    };

    handleContentSizeChange = (w: number, h: number) => {
        const { onContentSizeChange } = this.props;

        this.contentHeight = h;

        if (typeof onContentSizeChange === 'function') {
            onContentSizeChange(w, h);
        }
    };

    handleOnScroll = (e: any) => {
        this.scrollPosition = e.nativeEvent.contentOffset;
    };

    render() {
        const { children, style, contentContainerStyle, scrollEnabled, testID } = this.props;
        const { offset } = this.state;

        const extraProps = {};
        if (typeof scrollEnabled !== 'undefined') {
            Object.assign(
                extraProps,
                Platform.select({
                    android: { scrollEnabled },
                    ios: { canCancelContentTouches: scrollEnabled },
                }),
            );
        }

        return (
            <ScrollView
                testID={testID}
                ref={this.scrollViewRef}
                onScroll={this.handleOnScroll}
                bounces={false}
                scrollEventThrottle={16}
                automaticallyAdjustContentInsets={false}
                contentInsetAdjustmentBehavior="never"
                onLayout={this.handleLayout}
                onContentSizeChange={this.handleContentSizeChange}
                style={style}
                contentContainerStyle={[contentContainerStyle]}
                {...extraProps}
            >
                <Animated.View style={[styles.contentContainer, { paddingBottom: offset }]}>{children}</Animated.View>
            </ScrollView>
        );
    }
}

export default KeyboardAwareScrollView;
