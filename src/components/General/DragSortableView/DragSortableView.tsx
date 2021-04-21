// credits: https://github.com/mochixuan/react-native-drag-sort

/* eslint-disable no-underscore-dangle */
import React, { Component } from 'react';
import { Animated, Dimensions, Easing, PanResponder, TouchableOpacity, View } from 'react-native';

import styles from './styles';

const { width } = Dimensions.get('window');

const defaultZIndex = 8;
const touchZIndex = 99;

/* Types ==================================================================== */
interface Props {
    dataSource: any;
    parentWidth: number;
    childrenHeight: number;
    childrenWidth: number;

    marginChildrenTop?: number;
    marginChildrenBottom?: number;
    marginChildrenLeft?: number;
    marginChildrenRight?: number;

    sortable?: boolean;

    onClickItem?: (item: any, index: number) => void;
    onDragStart?: (startIndex: number) => void;
    onDragEnd?: (startIndex: number, endIndex: number) => void;
    onDataChange?: (data: any) => void;
    renderItem?: (item: any, index: number) => any;
    scaleStatus?: 'scale' | 'scaleX' | 'scaleY';
    fixedItems?: Array<any>;
    keyExtractor: (item: any, index: number) => string;
    testIDExtractor?: (item: any, index: number) => string;
    delayLongPress?: number;
    isDragFreely?: boolean;
    onDragging?: (gestureState: any, left: number, top: number, moveToIndex: number) => void;
    maxScale?: number;
    minOpacity?: number;
    scaleDuration?: number;
    slideDuration?: number;
}

interface State {
    dataSource: Array<any>;
    curPropsDataSource: Array<any>;
    height: number;
    itemWidth: number;
    itemHeight: number;
}

/* Component ==================================================================== */
export default class DragSortableView extends Component<Props, State> {
    private sortRefs: any;
    private panResponder: any;
    private isMovePanResponder: boolean;
    private isHasMove: boolean;
    private isScaleRecovery: any;
    private touchCurItem: any;

    static defaultProps = {
        marginChildrenTop: 0,
        marginChildrenBottom: 0,
        marginChildrenLeft: 0,
        marginChildrenRight: 0,
        parentWidth: width,
        sortable: true,
        scaleStatus: 'scale',
        fixedItems: [] as any,
        isDragFreely: false,
        maxScale: 1.1,
        minOpacity: 0.8,
        scaleDuration: 100,
        slideDuration: 300,
    };

    constructor(props: Props) {
        super(props);

        this.sortRefs = new Map();

        const itemWidth = props.childrenWidth + props.marginChildrenLeft + props.marginChildrenRight;
        const itemHeight = props.childrenHeight + props.marginChildrenTop + props.marginChildrenBottom;

        // this.reComplexDataSource(true,props) // react < 16.3
        // react > 16.3 Fiber
        const rowNum = Math.ceil(props.parentWidth / itemWidth);
        const dataSource = props.dataSource.map((item: any, index: number) => {
            const newData = {} as any;
            const left = (index % rowNum) * itemWidth;
            const top = Math.floor(index / rowNum) * itemHeight;

            newData.data = item;
            newData.originIndex = index;
            newData.originLeft = left;
            newData.originTop = top;
            newData.position = new Animated.ValueXY({
                x: Math.floor(left + 0.5),
                y: Math.floor(top + 0.5),
            });
            newData.scaleValue = new Animated.Value(1);
            return newData;
        });

        this.state = {
            dataSource,
            curPropsDataSource: props.dataSource,
            height: Math.ceil(dataSource.length / rowNum) * itemHeight,
            itemWidth,
            itemHeight,
        };

        this.panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onStartShouldSetPanResponderCapture: () => {
                this.isMovePanResponder = false;
                return false;
            },
            onMoveShouldSetPanResponder: () => this.isMovePanResponder,
            onMoveShouldSetPanResponderCapture: () => this.isMovePanResponder,

            onPanResponderGrant: () => {},
            onPanResponderMove: (evt, gestureState) => this.moveTouch(evt, gestureState),
            onPanResponderRelease: () => this.endTouch(),

            onPanResponderTerminationRequest: () => false,
            onShouldBlockNativeResponder: () => false,
        });
    }

    // react < 16.3
    // componentWillReceiveProps(nextProps) {
    //     if (this.props.dataSource != nextProps.dataSource) {
    //         this.reComplexDataSource(false,nextProps)
    //     }
    // }

    // react > 16.3 Fiber
    static getDerivedStateFromProps(nextProps: Props, prevState: State) {
        const itemWidth = nextProps.childrenWidth + nextProps.marginChildrenLeft + nextProps.marginChildrenRight;
        const itemHeight = nextProps.childrenHeight + nextProps.marginChildrenTop + nextProps.marginChildrenBottom;
        if (
            nextProps.dataSource !== prevState.curPropsDataSource ||
            itemWidth !== prevState.itemWidth ||
            itemHeight !== prevState.itemHeight
        ) {
            const rowNum = Math.ceil(nextProps.parentWidth / itemWidth);
            const dataSource = nextProps.dataSource.map((item: any, index: number) => {
                const newData = {} as any;
                const left = (index % rowNum) * itemWidth;
                const top = Math.floor(index / rowNum) * itemHeight;

                newData.data = item;
                newData.originIndex = index;
                newData.originLeft = left;
                newData.originTop = top;
                newData.position = new Animated.ValueXY({
                    x: Math.floor(left + 0.5),
                    y: Math.floor(top + 0.5),
                });
                newData.scaleValue = new Animated.Value(1);
                return newData;
            });
            return {
                dataSource,
                curPropsDataSource: nextProps.dataSource,
                height: Math.ceil(dataSource.length / rowNum) * itemHeight,
                itemWidth,
                itemHeight,
            };
        }
        return null;
    }

    startTouch(touchIndex: number) {
        const { fixedItems, sortable, maxScale, scaleDuration, onDragStart } = this.props;
        const { dataSource } = this.state;

        if (fixedItems.length > 0 && fixedItems.includes(touchIndex)) {
            return;
        }

        this.isHasMove = false;

        if (!sortable) return;

        const key = this.getItemKey(touchIndex);
        if (this.sortRefs.has(key)) {
            if (typeof onDragStart === 'function') {
                onDragStart(touchIndex);
            }
            Animated.timing(dataSource[touchIndex].scaleValue, {
                toValue: maxScale,
                duration: scaleDuration,
                useNativeDriver: false,
            }).start(() => {
                this.touchCurItem = {
                    ref: this.sortRefs.get(key),
                    index: touchIndex,
                    originLeft: dataSource[touchIndex].originLeft,
                    originTop: dataSource[touchIndex].originTop,
                    moveToIndex: touchIndex,
                };
                this.isMovePanResponder = true;
            });
        }
    }

    moveTouch(nativeEvent: any, gestureState: any) {
        const { parentWidth, isDragFreely, onDragging, slideDuration } = this.props;

        const { dataSource } = this.state;

        this.isHasMove = true;

        // if (this.isScaleRecovery) clearTimeout(this.isScaleRecovery)

        if (this.touchCurItem) {
            let { dx } = gestureState;
            let { dy } = gestureState;
            const { itemWidth } = this.state;
            const { itemHeight } = this.state;

            const rowNum = Math.ceil(parentWidth / itemWidth);
            const maxWidth = parentWidth - itemWidth;
            const maxHeight = itemHeight * Math.ceil(dataSource.length / rowNum) - itemHeight;

            // Is it free to drag
            if (!isDragFreely) {
                // Maximum or minimum after out of bounds
                if (this.touchCurItem.originLeft + dx < 0) {
                    dx = -this.touchCurItem.originLeft;
                } else if (this.touchCurItem.originLeft + dx > maxWidth) {
                    dx = maxWidth - this.touchCurItem.originLeft;
                }
                if (this.touchCurItem.originTop + dy < 0) {
                    dy = -this.touchCurItem.originTop;
                } else if (this.touchCurItem.originTop + dy > maxHeight) {
                    dy = maxHeight - this.touchCurItem.originTop;
                }
            }

            const left = this.touchCurItem.originLeft + dx;
            const top = this.touchCurItem.originTop + dy;

            this.touchCurItem.ref?.setNativeProps({
                style: {
                    zIndex: touchZIndex,
                },
            });

            dataSource[this.touchCurItem.index].position.setValue({
                x: left,
                y: top,
            });

            let moveToIndex = 0;
            let moveXNum = dx / itemWidth;
            let moveYNum = dy / itemHeight;
            if (moveXNum > 0) {
                moveXNum = Math.floor(moveXNum + 0.5);
            } else if (moveXNum < 0) {
                moveXNum = Math.floor(moveXNum - 0.5);
            }
            if (moveYNum > 0) {
                moveYNum = Math.floor(moveYNum + 0.5);
            } else if (moveYNum < 0) {
                moveYNum = Math.floor(moveYNum - 0.5);
            }

            moveToIndex = this.touchCurItem.index + moveXNum + moveYNum * rowNum;

            if (moveToIndex > dataSource.length - 1) {
                moveToIndex = dataSource.length - 1;
            } else if (moveToIndex < 0) {
                moveToIndex = 0;
            }

            if (typeof onDragging === 'function') {
                onDragging(gestureState, left, top, moveToIndex);
            }

            if (this.touchCurItem.moveToIndex !== moveToIndex) {
                const { fixedItems } = this.props;
                if (fixedItems.length > 0 && fixedItems.includes(moveToIndex)) return;
                this.touchCurItem.moveToIndex = moveToIndex;
                dataSource.forEach((item, index) => {
                    let nextItem = null;
                    if (index > this.touchCurItem.index && index <= moveToIndex) {
                        nextItem = dataSource[index - 1];
                    } else if (index >= moveToIndex && index < this.touchCurItem.index) {
                        nextItem = dataSource[index + 1];
                    } else if (
                        index !== this.touchCurItem.index &&
                        (item.position.x._value !== item.originLeft || item.position.y._value !== item.originTop)
                    ) {
                        nextItem = dataSource[index];
                    } else if (
                        (this.touchCurItem.index - moveToIndex > 0 && moveToIndex === index + 1) ||
                        (this.touchCurItem.index - moveToIndex < 0 && moveToIndex === index - 1)
                    ) {
                        nextItem = dataSource[index];
                    }

                    if (nextItem != null) {
                        Animated.timing(item.position, {
                            toValue: {
                                x: Math.floor(nextItem.originLeft + 0.5),
                                y: Math.floor(nextItem.originTop + 0.5),
                            },
                            duration: slideDuration,
                            easing: Easing.out(Easing.quad),
                            useNativeDriver: false,
                        }).start();
                    }
                });
            }
        }
    }

    endTouch() {
        const { onDragEnd, scaleDuration } = this.props;
        const { dataSource } = this.state;
        // clear
        if (this.touchCurItem) {
            if (typeof onDragEnd === 'function') {
                onDragEnd(this.touchCurItem.index, this.touchCurItem.moveToIndex);
            }
            // this.state.dataSource[this.touchCurItem.index].scaleValue.setValue(1)
            Animated.timing(dataSource[this.touchCurItem.index].scaleValue, {
                toValue: 1,
                duration: scaleDuration,
                useNativeDriver: false,
            }).start(() => {
                this.touchCurItem.ref?.setNativeProps({
                    style: {
                        zIndex: defaultZIndex,
                    },
                });
                this.changePosition(this.touchCurItem.index, this.touchCurItem.moveToIndex);
                this.touchCurItem = null;
            });
        }
    }

    onPressOut() {
        this.isScaleRecovery = setTimeout(() => {
            if (this.isMovePanResponder && !this.isHasMove) {
                this.endTouch();
            }
        }, 220);
    }

    changePosition(startIndex: number, endIndex: number) {
        const { onDataChange } = this.props;
        const { dataSource } = this.state;

        if (startIndex === endIndex) {
            const curItem = dataSource[startIndex];
            if (curItem != null) {
                curItem.position.setValue({
                    x: Math.floor(curItem.originLeft + 0.5),
                    y: Math.floor(curItem.originTop + 0.5),
                });
            }
            return;
        }

        let isCommon = true;
        if (startIndex > endIndex) {
            isCommon = false;
            const tempIndex = startIndex;
            startIndex = endIndex;
            endIndex = tempIndex;
        }

        const newDataSource = [...dataSource].map((item, index) => {
            let newIndex = null;
            if (isCommon) {
                if (endIndex > index && index >= startIndex) {
                    newIndex = index + 1;
                } else if (endIndex === index) {
                    newIndex = startIndex;
                }
            } else if (endIndex >= index && index > startIndex) {
                newIndex = index - 1;
            } else if (startIndex === index) {
                newIndex = endIndex;
            }

            if (newIndex != null) {
                const newItem = { ...dataSource[newIndex] };
                newItem.originLeft = item.originLeft;
                newItem.originTop = item.originTop;
                newItem.position = new Animated.ValueXY({
                    x: Math.floor(item.originLeft + 0.5),
                    y: Math.floor(item.originTop + 0.5),
                });
                item = newItem;
            }

            return item;
        });

        this.setState(
            {
                dataSource: newDataSource,
            },
            () => {
                if (typeof onDataChange === 'function') {
                    onDataChange(this.getOriginalData());
                }
                // Prevent RN from drawing the beginning and end
                const startItem = newDataSource[startIndex];
                newDataSource[startIndex].position.setValue({
                    x: Math.floor(startItem.originLeft + 0.5),
                    y: Math.floor(startItem.originTop + 0.5),
                });
                const endItem = newDataSource[endIndex];
                newDataSource[endIndex].position.setValue({
                    x: Math.floor(endItem.originLeft + 0.5),
                    y: Math.floor(endItem.originTop + 0.5),
                });
            },
        );
    }

    reComplexDataSource(isInit: boolean, props: Props) {
        const { parentWidth } = props;
        const { itemWidth, itemHeight } = this.state;

        const rowNum = Math.ceil(parentWidth / itemWidth);
        const dataSource = props.dataSource.map((item: any, index: number) => {
            const newData = {} as any;
            const left = (index % rowNum) * itemWidth;
            const top = Math.floor(index / rowNum) * itemHeight;

            newData.data = item;
            newData.originIndex = index;
            newData.originLeft = left;
            newData.originTop = top;
            newData.position = new Animated.ValueXY({
                x: Math.floor(left + 0.5),
                y: Math.floor(top + 0.5),
            });
            newData.scaleValue = new Animated.Value(1);
            return newData;
        });

        if (isInit) {
            this.setState({
                dataSource,
                height: Math.ceil(dataSource.length / rowNum) * itemHeight,
            });
        } else {
            this.setState({
                dataSource,
                height: Math.ceil(dataSource.length / rowNum) * itemHeight,
            });
        }
    }

    getOriginalData() {
        const { dataSource } = this.state;
        return dataSource.map((item) => item.data);
    }

    render() {
        const { parentWidth } = this.props;
        const { height } = this.state;

        return (
            <View
                // ref={(ref)=>this.sortParentRef=ref}
                style={[
                    styles.container,
                    {
                        width: parentWidth,
                        height,
                    },
                ]}
                // onLayout={()=> {}}
            >
                {this.renderItemView()}
            </View>
        );
    }

    getItemKey = (index: number) => {
        const { keyExtractor } = this.props;
        const { dataSource } = this.state;

        const item = dataSource[index];
        return keyExtractor ? keyExtractor(item.data, index) : item.originIndex;
    };

    getItemTestID = (index: number) => {
        const { testIDExtractor } = this.props;
        const { dataSource } = this.state;

        if (typeof testIDExtractor === 'function') {
            const item = dataSource[index];
            return testIDExtractor(item.data, index);
        }

        return undefined;
    };

    renderItemView = () => {
        const {
            maxScale,
            minOpacity,
            scaleStatus,
            marginChildrenTop,
            marginChildrenBottom,
            marginChildrenLeft,
            marginChildrenRight,
            delayLongPress,
            onClickItem,
            renderItem,
        } = this.props;
        const { dataSource } = this.state;

        const inputRange = maxScale >= 1 ? [1, maxScale] : [maxScale, 1];
        const outputRange = maxScale >= 1 ? [1, minOpacity] : [minOpacity, 1];
        return dataSource.map((item, index) => {
            const transformObj = {} as any;
            transformObj[scaleStatus] = item.scaleValue;
            const key = this.getItemKey(index);
            const testID = this.getItemTestID(index);

            return (
                <Animated.View
                    key={key}
                    ref={(ref) => this.sortRefs.set(key, ref)}
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...this.panResponder.panHandlers}
                    style={[
                        styles.item,
                        {
                            marginTop: marginChildrenTop,
                            marginBottom: marginChildrenBottom,
                            marginLeft: marginChildrenLeft,
                            marginRight: marginChildrenRight,
                            left: item.position.x,
                            top: item.position.y,
                            opacity: item.scaleValue.interpolate({ inputRange, outputRange }),
                            transform: [transformObj],
                        },
                    ]}
                >
                    <TouchableOpacity
                        testID={testID}
                        activeOpacity={1}
                        delayLongPress={delayLongPress}
                        onPressOut={() => this.onPressOut()}
                        onLongPress={() => this.startTouch(index)}
                        onPress={() => {
                            if (typeof onClickItem === 'function') {
                                onClickItem(item.data, index);
                            }
                        }}
                    >
                        {renderItem(item.data, index)}
                    </TouchableOpacity>
                </Animated.View>
            );
        });
    };

    componentWillUnmount() {
        if (this.isScaleRecovery) clearTimeout(this.isScaleRecovery);
    }
}
