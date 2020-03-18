/* eslint-disable react-native/no-unused-styles */
/* eslint-disable react/jsx-props-no-spreading */

import React, { Component, Children } from 'react';
import { View, ScrollView, Animated, Platform, ViewStyle } from 'react-native';

import Indicator from './PageIndicator';

import styles from './styles';

// eslint-disable-next-line no-restricted-properties
const floatEpsilon = Math.pow(2, -23);

function equal(a: number, b: number) {
    return Math.abs(a - b) <= floatEpsilon * Math.max(Math.abs(a), Math.abs(b));
}

interface Props {
    style?: ViewStyle;
    pagingEnabled?: boolean;
    showsHorizontalScrollIndicator?: boolean;
    showsVerticalScrollIndicator?: boolean;
    scrollEventThrottle?: number;
    scrollsToTop?: boolean;

    indicatorOpacity?: number;
    indicatorPosition?: 'none' | 'top' | 'right' | 'bottom' | 'left';

    startPage?: number;

    horizontal?: boolean;
    rtl?: boolean;

    onLayout?: (event: any) => void;
    onScrollEnd?: (progress: any) => void;
    onFinish?: () => void;
}

interface State {
    width: number;
    height: number;
    progress: Animated.Value;
}

export default class Slider extends Component<Props, State> {
    progress: number;
    mounted: boolean;
    scrollState: number;

    private scroll: React.RefObject<ScrollView>;

    static defaultProps = {
        pagingEnabled: true,
        showsHorizontalScrollIndicator: false,
        showsVerticalScrollIndicator: false,
        scrollEventThrottle: 30,
        scrollsToTop: false,
        indicatorOpacity: 0.3,
        startPage: 0,
        horizontal: true,
        rtl: false,
    };

    constructor(props: Props) {
        super(props);

        const { startPage } = this.props;

        this.progress = startPage;
        this.mounted = false;
        this.scrollState = -1;
        this.scroll = React.createRef();

        this.state = {
            width: 0,
            height: 0,
            progress: new Animated.Value(startPage),
        };
    }

    componentDidMount() {
        this.mounted = true;
    }

    componentDidUpdate() {
        if (this.scrollState === -1) {
            /* Fix scroll position after layout update */
            requestAnimationFrame(() => {
                this.scrollToPage(Math.floor(this.progress), false);
            });
        }
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    onLayout = (event: any) => {
        const { width, height } = event.nativeEvent.layout;
        const { onLayout } = this.props;

        if (typeof onLayout === 'function') {
            onLayout(event);
        }

        this.setState({ width, height });
    };

    onScroll = (event: any) => {
        const { horizontal } = this.props;
        const { [horizontal ? 'x' : 'y']: offset } = event.nativeEvent.contentOffset;
        const { [horizontal ? 'width' : 'height']: base, progress } = this.state;

        progress.setValue((this.progress = base ? offset / base : 0));

        const discreteProgress = Math.round(this.progress);

        if (this.scrollState === 1 && equal(discreteProgress, this.progress)) {
            this.onScrollEnd();

            this.scrollState = -1;
        }
    };

    onScrollBeginDrag = () => {
        this.scrollState = 0;
    };

    onScrollEndDrag = () => {
        const { horizontal } = this.props;

        /* Vertical pagination is not working on android, scroll by hands */
        if (Platform.OS === 'android' && !horizontal) {
            this.scrollToPage(Math.round(this.progress));
        }

        this.scrollState = 1;
    };

    onScrollEnd = () => {
        const { onScrollEnd } = this.props;

        if (typeof onScrollEnd === 'function') {
            onScrollEnd(Math.round(this.progress));
        }
    };

    scrollToPage = (page: number, animated = true) => {
        const { horizontal } = this.props;
        const { [horizontal ? 'width' : 'height']: base } = this.state;

        if (animated) {
            this.scrollState = 1;
        }

        if (this.mounted && this.scroll) {
            this.scroll.current.scrollTo({
                [horizontal ? 'x' : 'y']: page * base,
                animated,
            });
        }
    };

    isDragging() {
        return this.scrollState === 0;
    }

    isDecelerating() {
        return this.scrollState === 1;
    }

    renderPage = (page: any, index: number) => {
        const { width, height } = this.state;
        let { progress } = this.state;
        const { children, horizontal, rtl } = this.props;

        const pages = Children.count(children);

        const pageStyle = horizontal && rtl ? styles.rtl : null;

        /* Adjust progress by page index */
        // @ts-ignore
        progress = Animated.add(progress, -index);

        return (
            <View style={[{ width, height }, pageStyle]}>{React.cloneElement(page, { index, pages, progress })}</View>
        );
    };

    renderIndicator = (pager: any) => {
        const { horizontal, rtl } = this.props;

        const { indicatorPosition } = pager;

        if (indicatorPosition === 'none') {
            return null;
        }

        const indicatorStyle = horizontal && rtl ? styles.rtl : null;

        return (
            // @ts-ignore
            <View style={[styles[indicatorPosition], indicatorStyle]}>
                {/* eslint-disable-next-line */}
                <Indicator {...pager} scrollTo={this.scrollToPage} />
            </View>
        );
    };

    render() {
        const { progress } = this.state;
        const { horizontal, rtl, onFinish } = this.props;
        const {
            style,
            children,
            indicatorOpacity,
            indicatorPosition = horizontal ? 'bottom' : 'right',
            ...props
        } = this.props;

        const pages = Children.count(children);

        const Pager = () => {
            return this.renderIndicator({
                pages,
                progress,
                indicatorOpacity,
                indicatorPosition,
                onFinish,
            });
        };

        const scrollStyle = horizontal && rtl ? styles.rtl : null;

        return (
            <View style={[styles.container]}>
                <ScrollView
                    {...props}
                    style={[styles.scrollView, style, scrollStyle]}
                    onLayout={event => this.onLayout(event)}
                    onScroll={this.onScroll}
                    onScrollBeginDrag={this.onScrollBeginDrag}
                    onScrollEndDrag={this.onScrollEndDrag}
                    ref={this.scroll}
                >
                    {Children.map(children, this.renderPage)}
                </ScrollView>

                <Pager />
            </View>
        );
    }
}
