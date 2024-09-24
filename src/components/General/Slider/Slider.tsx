/* eslint-disable react-native/no-unused-styles */
/* eslint-disable react/jsx-props-no-spreading */

import React, { Component, Children } from 'react';
import { View, ScrollView, Animated, ViewStyle } from 'react-native';

import Indicator from './PageIndicator';

import styles from './styles';

/* Constants ==================================================================== */
const floatEpsilon = 2 ** -23;

function equal(a: number, b: number) {
    return Math.abs(a - b) <= floatEpsilon * Math.max(Math.abs(a), Math.abs(b));
}

/* Types ==================================================================== */
interface Props {
    children: React.ReactNode;
    style?: ViewStyle;
    pagingEnabled?: boolean;
    showsHorizontalScrollIndicator?: boolean;
    scrollEventThrottle?: number;
    scrollsToTop?: boolean;

    indicatorOpacity?: number;
    indicatorPosition?: 'none' | 'top' | 'right' | 'bottom' | 'left';

    startPage?: number;

    onLayout?: (event: any) => void;
    onScrollEnd?: (progress: any) => void;
    onFinish?: () => void;
}

interface State {
    width: number;
    height: number;
    progress: Animated.Value;
}

/* Component ==================================================================== */
export default class Slider extends Component<Props, State> {
    progress: number;
    mounted: boolean;
    scrollState: number;

    private scroll: React.RefObject<ScrollView>;

    static defaultProps = {
        pagingEnabled: true,
        nestedScrollEnabled: true,
        showsHorizontalScrollIndicator: false,
        showsVerticalScrollIndicator: false,
        scrollEventThrottle: 25,
        scrollsToTop: false,
        indicatorOpacity: 0.3,
        startPage: 0,
        horizontal: true,
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
        const { x: offset } = event.nativeEvent.contentOffset;
        const { width: base, progress } = this.state;

        progress.setValue((this.progress = base ? offset / base : 0));

        const discreteProgress = Math.round(this.progress);

        if (this.scrollState === 1 && equal(discreteProgress, this.progress)) {
            this.scrollState = -1;
        }
    };

    onScrollBeginDrag = () => {
        this.scrollState = 0;
    };

    onScrollEndDrag = () => {
        this.scrollState = 1;
    };

    scrollToPage = (page: number, animated = true) => {
        const { width: base } = this.state;

        if (animated) {
            this.scrollState = 1;
        }

        if (this.mounted && this.scroll) {
            this.scroll.current.scrollTo({
                x: page * base,
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
        const { children } = this.props;

        const pages = Children.count(children);

        /* Adjust progress by page index */
        // @ts-ignore
        progress = Animated.add(progress, -index);

        return <View style={[{ width, height }]}>{React.cloneElement(page, { index, pages, progress })}</View>;
    };

    renderIndicator = (pager: any) => {
        const { indicatorPosition } = pager;

        if (indicatorPosition === 'none') {
            return null;
        }

        return (
            // @ts-ignore
            <View style={[styles[indicatorPosition]]}>
                {/* eslint-disable-next-line */}
                <Indicator {...pager} scrollTo={this.scrollToPage} />
            </View>
        );
    };

    render() {
        const { progress } = this.state;
        const { onFinish } = this.props;
        const { style, children, indicatorOpacity, indicatorPosition = 'bottom', ...props } = this.props;

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

        return (
            <View style={[styles.container]}>
                <ScrollView
                    {...props}
                    style={[styles.scrollView, style]}
                    onLayout={(event) => this.onLayout(event)}
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
