/* eslint-disable react-native/no-unused-styles */
/* eslint-disable react/jsx-props-no-spreading */

import React, { Component, Children } from 'react';
import { View, ScrollView, Animated, ViewStyle, InteractionManager } from 'react-native';

import Indicator from './PageIndicator';

import styles from './styles';

/* Constants ==================================================================== */
const FLOAT_EPSILON = 2 ** -23;
const AUTO_SCROLL_INTERVAL = 5000; // 5s

function equal(a: number, b: number) {
    return Math.abs(a - b) <= FLOAT_EPSILON * Math.max(Math.abs(a), Math.abs(b));
}

/* Types ==================================================================== */
interface Props {
    children: React.ReactNode;
    style?: ViewStyle;
    scrollAutomatically?: boolean;
    scrollEnabled?: boolean;
    horizontal?: boolean;
    showsVerticalScrollIndicator?: boolean;
    pagingEnabled?: boolean;
    showsHorizontalScrollIndicator?: boolean;
    scrollEventThrottle?: number;
    scrollsToTop?: boolean;

    indicatorOpacity?: number;
    indicatorPosition?: 'none' | 'top' | 'right' | 'bottom' | 'left';

    startPage: number;

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
    private progress: number;
    private mounted: boolean;
    private scrollState: number;
    private autoScrollInterval: NodeJS.Timeout | null;

    private scrollRef: React.RefObject<ScrollView>;

    declare readonly props: Props & Required<Pick<Props, keyof typeof Slider.defaultProps>>;

    static defaultProps: Partial<Props> = {
        pagingEnabled: true,
        showsHorizontalScrollIndicator: false,
        scrollEventThrottle: 25,
        scrollsToTop: false,
        indicatorOpacity: 0.3,
        startPage: 0,
        scrollAutomatically: false,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            width: 0,
            height: 0,
            progress: new Animated.Value(props.startPage),
        };

        this.progress = props.startPage;
        this.mounted = false;
        this.scrollState = -1;
        this.autoScrollInterval = null;

        this.scrollRef = React.createRef();
    }

    componentDidMount() {
        this.mounted = true;

        InteractionManager.runAfterInteractions(this.startAutoScroll);
    }

    componentWillUnmount() {
        this.mounted = false;

        this.stopAutoScroll();
    }

    startAutoScroll = () => {
        const { scrollAutomatically } = this.props;

        if (scrollAutomatically) {
            this.autoScrollInterval = setInterval(this.autoScroll, AUTO_SCROLL_INTERVAL);
        }
    };

    stopAutoScroll = () => {
        if (this.autoScrollInterval) {
            clearInterval(this.autoScrollInterval);
        }
    };

    autoScroll = () => {
        const { children } = this.props;
        const { progress } = this.state;

        const pages = Children.count(children);
        // @ts-ignore __getValue
        const nextPage = (Math.round(progress.__getValue()) + 1) % pages;

        this.scrollToPage(nextPage);
    };

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
        this.stopAutoScroll(); // stop auto scroll when user begins to drag
    };

    onScrollEndDrag = () => {
        this.scrollState = 1;
    };

    scrollToPage = (page: number, animated = true) => {
        const { width: base } = this.state;

        if (animated) {
            this.scrollState = 1;
        }

        if (this.mounted) {
            this.scrollRef?.current?.scrollTo({
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
        const { progress, width, height } = this.state;
        const { children } = this.props;

        const pages = Children.count(children);

        /* Adjust progress by page index */
        const adjustedProgress = Animated.add(progress, -index);

        return (
            <View style={[{ width, height }]}>
                {React.cloneElement(page, { index, pages, progress: adjustedProgress })}
            </View>
        );
    };

    renderIndicator = (pager: any) => {
        const { indicatorPosition } = pager;

        if (indicatorPosition === 'none') {
            return null;
        }

        let indicatorStyle: ViewStyle | undefined;

        if (indicatorPosition in styles) {
            // @ts-ignore
            indicatorStyle = styles[indicatorPosition];
        }

        if (typeof indicatorStyle === 'undefined') {
            return null;
        }

        return (
            <View style={indicatorStyle}>
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
            <View style={styles.container}>
                <ScrollView
                    {...props}
                    style={[styles.scrollView, style]}
                    onLayout={this.onLayout}
                    onScroll={this.onScroll}
                    onScrollBeginDrag={this.onScrollBeginDrag}
                    onScrollEndDrag={this.onScrollEndDrag}
                    ref={this.scrollRef}
                    horizontal
                >
                    {Children.map(children, this.renderPage)}
                </ScrollView>

                <Pager />
            </View>
        );
    }
}
