import React, { useRef, useEffect, useCallback, useState, FC, memo, ReactNode } from 'react';
import {
    ScrollView,
    Keyboard,
    KeyboardEvent,
    ScrollViewProps,
    Platform,
    NativeSyntheticEvent,
    NativeScrollEvent,
    LayoutChangeEvent,
    TextInput,
} from 'react-native';

// import { hasNotch } from '@common/helpers/device';

// const SAFE_AREA_BOTTOM_OFFSET = hasNotch() ? 34 : 0;
const isIphoneX = true;
const top = Platform.OS === 'ios' ? -50 : 0;

interface Props extends ScrollViewProps {
    children: ReactNode;
}

const KeyboardScrollViewComponent: FC<Props> = (props) => {
    const { onScroll, onContentSizeChange, onLayout } = props;

    const scrollViewRef = useRef<ScrollView | null>(null);
    const scrollPosition = useRef(0);
    const contentHeight = useRef(0);
    const viewHeight = useRef(0);

    const [contentInset, setContentInset] = useState({ top: 0, bottom: 0 });

    const scrollToFocusedTextInput = useCallback(() => {
        const currentlyFocusedField = TextInput.State.currentlyFocusedInput();

        if (!currentlyFocusedField) {
            return;
        }

        setTimeout(() => {
            currentlyFocusedField.measureInWindow((_x, _y, _width, height) => {
                const additionalOffset = height + 60;

                if (scrollViewRef.current) {
                    scrollViewRef.current
                        .getScrollResponder()
                        .scrollResponderScrollNativeHandleToKeyboard(currentlyFocusedField, additionalOffset, true);
                }
            });
        }, 10);
    }, []);

    const onKeyboardWillShow = useCallback(
        (event: KeyboardEvent) => {
            const keyboardHeight = event.endCoordinates.height;
            const bottom = isIphoneX ? keyboardHeight - 68 : keyboardHeight;

            setContentInset({ top, bottom });

            scrollToFocusedTextInput();
        },
        [scrollToFocusedTextInput],
    );

    const onKeyboardWillHide = useCallback(() => {
        setContentInset({ top, bottom: 0 });

        const currentPosition = scrollPosition.current + viewHeight.current;

        if (scrollViewRef.current && Platform.OS === 'ios' && currentPosition > contentHeight.current) {
            scrollViewRef.current.scrollToEnd();
        }
    }, []);

    const handleOnScroll = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            scrollPosition.current = event.nativeEvent.contentOffset.y;

            if (onScroll) {
                onScroll(event);
            }
        },
        [onScroll],
    );

    const handleContentSizeChange = useCallback(
        (w: number, h: number) => {
            contentHeight.current = h;

            if (onContentSizeChange) {
                onContentSizeChange(w, h);
            }
        },
        [onContentSizeChange],
    );

    const handleLayout = useCallback(
        (event: LayoutChangeEvent) => {
            viewHeight.current = event.nativeEvent.layout.height;

            if (onLayout) {
                onLayout(event);
            }
        },
        [onLayout],
    );

    useEffect(() => {
        const keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', onKeyboardWillShow);
        const keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', onKeyboardWillHide);

        return () => {
            keyboardWillShowListener.remove();
            keyboardWillHideListener.remove();
        };
    }, [onKeyboardWillHide, onKeyboardWillShow]);

    return (
        <ScrollView
            ref={scrollViewRef}
            onScroll={handleOnScroll}
            scrollEventThrottle={16}
            onContentSizeChange={handleContentSizeChange}
            contentInset={contentInset}
            onLayout={handleLayout}
        />
    );
};

export const KeyboardScrollView = memo(KeyboardScrollViewComponent);
