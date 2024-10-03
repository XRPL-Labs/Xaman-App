// https://github.com/lhandel/react-native-card-flip

import React, { Component } from 'react';

import { Platform, Animated, StyleProp, ViewStyle } from 'react-native';

import styles from './styles';
/* Types ==================================================================== */
export type FlipDirection = 'y' | 'x';

export type Direction = 'right' | 'left';

interface Props {
    style?: StyleProp<ViewStyle>;
    duration?: number;
    flipZoom?: number;
    flipDirection?: FlipDirection;
    onFlip?: (index: number) => void;
    onFlipEnd?: (index: number) => void;
    onFlipStart?: (index: number) => void;
    perspective?: number;
    children: JSX.Element[];
}

interface State {
    duration: number;
    flipZoom?: number;
    flipDirection?: FlipDirection;
    side: number;
    sides: JSX.Element[];
    progress: Animated.Value;
    rotation: Animated.ValueXY;
    zoom: Animated.Value;
    rotateOrientation: FlipDirection;
}

/* Component ==================================================================== */
class CardFlip extends Component<Props, State> {
    declare readonly props: Props & Required<Pick<Props, keyof typeof CardFlip.defaultProps>>;

    static defaultProps: Partial<Props> = {
        style: {},
        duration: 500,
        flipZoom: 0.09,
        flipDirection: 'y',
        perspective: 800,
        onFlip: () => {},
        onFlipStart: () => {},
        onFlipEnd: () => {},
    };

    constructor(props: Props) {
        super(props);
        this.state = {
            duration: 5000,
            side: 0,
            sides: [],
            progress: new Animated.Value(0),
            rotation: new Animated.ValueXY({ x: 50, y: 50 }),
            zoom: new Animated.Value(0),
            rotateOrientation: 'y',
        };
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State) {
        if (
            nextProps.duration !== prevState.duration ||
            nextProps.flipZoom !== prevState.flipZoom ||
            nextProps.children !== prevState.sides
        ) {
            return {
                duration: nextProps.duration,
                flipZoom: nextProps.flipZoom,
                sides: nextProps.children,
            };
        }
        return null;
    }

    componentDidMount() {
        const { duration, flipZoom, children } = this.props;
        this.setState({
            duration,
            flipZoom,
            sides: children,
        });
    }

    tip(customConfig: any) {
        const defaultConfig = { direction: 'left', progress: 0.05, duration: 150 };
        const config = { ...defaultConfig, ...customConfig };
        const { direction, progress, duration } = config;

        const { rotation, side } = this.state;
        const sequence = [];

        if (direction === 'right') {
            sequence.push(
                Animated.timing(rotation, {
                    toValue: {
                        x: 0,
                        y: side === 0 ? 50 + progress * 50 : 90,
                    },
                    duration,
                    useNativeDriver: true,
                }),
            );
        } else {
            sequence.push(
                Animated.timing(rotation, {
                    toValue: {
                        x: 0,
                        y: side === 0 ? 50 - progress * 50 : 90,
                    },
                    duration,
                    useNativeDriver: true,
                }),
            );
        }
        sequence.push(
            Animated.timing(rotation, {
                toValue: {
                    x: 0,
                    y: side === 0 ? 50 : 100,
                },
                duration,
                useNativeDriver: true,
            }),
        );
        Animated.sequence(sequence).start();
    }

    jiggle(customConfig = {}) {
        const defaultConfig = { count: 2, duration: 100, progress: 0.05 };
        const config = { ...defaultConfig, ...customConfig };

        const { count, duration, progress } = config;

        const { rotation, side } = this.state;

        const sequence = [];
        for (let i = 0; i < count; i++) {
            sequence.push(
                Animated.timing(rotation, {
                    toValue: {
                        x: 0,
                        y: side === 0 ? 50 + progress * 50 : 90,
                    },
                    duration,
                    useNativeDriver: true,
                }),
            );

            sequence.push(
                Animated.timing(rotation, {
                    toValue: {
                        x: 0,
                        y: side === 0 ? 50 - progress * 50 : 110,
                    },
                    duration,
                    useNativeDriver: true,
                }),
            );
        }
        sequence.push(
            Animated.timing(rotation, {
                toValue: {
                    x: 0,
                    y: side === 0 ? 50 : 100,
                },
                duration,
                useNativeDriver: true,
            }),
        );
        Animated.sequence(sequence).start();
    }

    flip() {
        const { flipDirection } = this.props;
        if (flipDirection === 'y') {
            this.flipY();
        } else {
            this.flipX();
        }
    }

    flipY() {
        const { side } = this.state;
        this.flipTo({
            x: 50,
            y: side === 0 ? 100 : 50,
        });
        this.setState({
            side: side === 0 ? 1 : 0,
            rotateOrientation: 'y',
        });
    }

    flipX() {
        const { side } = this.state;
        this.flipTo({
            y: 50,
            x: side === 0 ? 100 : 50,
        });
        this.setState({
            side: side === 0 ? 1 : 0,
            rotateOrientation: 'x',
        });
    }

    private flipTo(toValue: any) {
        const { onFlip, onFlipStart, onFlipEnd } = this.props;
        const { duration, rotation, progress, zoom, side } = this.state;

        onFlip(side === 0 ? 1 : 0);
        onFlipStart(side === 0 ? 1 : 0);

        Animated.parallel([
            Animated.timing(progress, {
                toValue: side === 0 ? 100 : 0,
                duration,
                useNativeDriver: true,
            }),
            Animated.sequence([
                Animated.timing(zoom, {
                    toValue: 100,
                    duration: duration / 2,
                    useNativeDriver: true,
                }),
                Animated.timing(zoom, {
                    toValue: 0,
                    duration: duration / 2,
                    useNativeDriver: true,
                }),
            ]),
            Animated.timing(rotation, {
                toValue,
                duration,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onFlipEnd(side === 0 ? 1 : 0);
        });
    }

    getCardATransformation() {
        const { perspective } = this.props;
        const { progress, rotation, side, rotateOrientation } = this.state;

        const sideAOpacity = progress.interpolate({
            inputRange: [50, 51],
            outputRange: [100, 0],
            extrapolate: 'clamp',
        });

        const sideATransform = {
            opacity: sideAOpacity,
            zIndex: side === 0 ? 1 : 0,
            transform: [{ perspective }],
        };
        if (rotateOrientation === 'x') {
            const aXRotation = rotation.x.interpolate({
                inputRange: [0, 50, 100, 150],
                outputRange: ['-180deg', '0deg', '180deg', '0deg'],
                extrapolate: 'clamp',
            });
            // @ts-ignore
            sideATransform.transform.push({ rotateX: aXRotation });
        } else {
            // cardA Y-rotation
            const aYRotation = rotation.y.interpolate({
                inputRange: [0, 50, 100, 150],
                outputRange: ['-180deg', '0deg', '180deg', '0deg'],
                extrapolate: 'clamp',
            });
            // @ts-ignore
            sideATransform.transform.push({ rotateY: aYRotation });
        }
        return sideATransform;
    }

    getCardBTransformation() {
        const { progress, rotation, side, rotateOrientation } = this.state;
        const { perspective } = this.props;

        let bYRotation;

        const sideBOpacity = progress.interpolate({
            inputRange: [50, 51],
            outputRange: [0, 100],
            extrapolate: 'clamp',
        });

        const sideBTransform = {
            opacity: sideBOpacity,
            zIndex: side === 0 ? 0 : 1,
            transform: [{ perspective: -1 * perspective }],
        };

        if (rotateOrientation === 'x') {
            const bXRotation = rotation.x.interpolate({
                inputRange: [0, 50, 100, 150],
                outputRange: ['0deg', '-180deg', '-360deg', '180deg'],
                extrapolate: 'clamp',
            });
            // @ts-ignore
            sideBTransform.transform.push({ rotateX: bXRotation });
        } else {
            if (Platform.OS === 'ios') {
                // cardB Y-rotation
                bYRotation = rotation.y.interpolate({
                    inputRange: [0, 50, 100, 150],
                    outputRange: ['0deg', '180deg', '0deg', '-180deg'],
                    extrapolate: 'clamp',
                });
            } else {
                // cardB Y-rotation
                bYRotation = rotation.y.interpolate({
                    inputRange: [0, 50, 100, 150],
                    outputRange: ['0deg', '-180deg', '0deg', '180deg'],
                    extrapolate: 'clamp',
                });
            }
            // @ts-ignore
            sideBTransform.transform.push({ rotateY: bYRotation });
        }
        return sideBTransform;
    }

    render() {
        const { zoom, sides } = this.state;
        const { flipZoom, style } = this.props;

        const cardATransform = this.getCardATransformation();

        const cardBTransform = this.getCardBTransformation();

        const cardZoom = zoom.interpolate({
            inputRange: [0, 100],
            outputRange: [1, 1 + flipZoom],
            extrapolate: 'clamp',
        });

        const scaling = {
            transform: [{ scale: cardZoom }],
        };

        return (
            <Animated.View style={[style, scaling]}>
                <Animated.View style={[styles.cardContainer, cardATransform]}>{sides[0]}</Animated.View>
                <Animated.View style={[styles.cardContainer, cardBTransform]}>{sides[1]}</Animated.View>
            </Animated.View>
        );
    }
}

export default CardFlip;
