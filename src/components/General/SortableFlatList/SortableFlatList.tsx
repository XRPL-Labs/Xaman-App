// credits: https://github.com/mochixuan/react-native-drag-sort
import React, { Component } from 'react';
import {
    FlatList,
    GestureResponderEvent,
    ListRenderItem,
    NativeScrollEvent,
    NativeSyntheticEvent,
    PanResponder,
    PanResponderInstance,
    PanResponderGestureState,
    LayoutChangeEvent,
} from 'react-native';

import CellComponent from '@components/General/SortableFlatList/CellComponent';

import styles from './styles';

/* Types ==================================================================== */
interface Props {
    testID?: string;
    itemHeight: number;
    separatorHeight?: number;
    dataSource: Array<any>;
    sortable?: boolean;
    renderItem: ListRenderItem<any> | null | undefined;
    renderEmptyList?: React.ComponentType<any> | React.ReactElement | null | undefined;
    onItemPress?: (item: any, index: number) => void;
    keyExtractor?: ((item: any, index: number) => string) | undefined;
    onDataChange?: (dataSource: Array<any>) => void;
}

interface State {
    containerHeight: number;
    isItemActive: boolean;
}

enum AutoScrollState {
    DISABLED = 'DISABLED',
    MOVING_UP = 'MOVING_UP',
    MOVING_DOWN = 'MOVING_DOWN',
}

/* Component ==================================================================== */
export default class SortableFlatList extends Component<Props, State> {
    private itemRefs: Map<number, CellComponent>;
    private itemRefsSnapShot: Map<number, CellComponent>;
    private itemPositions: Map<number, number>;
    private activeItem: CellComponent;
    private listRef: React.RefObject<FlatList>;

    private scaleRecoveryTimeout: NodeJS.Timeout;
    private panResponder: PanResponderInstance;
    private isMovePanResponder: boolean;
    private isActiveItemMoved: boolean;

    private scrollWindowHeight: number;
    private currentScrollOffset: number;
    private currentAutoScrollDy: number;
    private currentAutoScrollChanges: number;
    private autoScrollInterval: NodeJS.Timeout;
    private currentAutoScrollState: AutoScrollState;

    static defaultProps = {
        separatorHeight: 0,
        sortable: true,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            containerHeight: (props.itemHeight + props.separatorHeight) * props.dataSource.length,
            isItemActive: false,
        };

        this.itemRefs = new Map();
        this.itemRefsSnapShot = new Map();
        this.itemPositions = new Map();
        this.listRef = React.createRef();
        this.activeItem = undefined;

        // init variables
        this.isMovePanResponder = false;

        // scroll tracks
        this.scrollWindowHeight = 0;
        this.currentScrollOffset = 0;
        this.currentAutoScrollDy = 0;
        this.currentAutoScrollChanges = 0;
        this.currentAutoScrollState = AutoScrollState.DISABLED;

        // create pan responder listeners
        this.panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onStartShouldSetPanResponderCapture: () => {
                this.isMovePanResponder = false;
                return false;
            },
            onMoveShouldSetPanResponder: () => this.isMovePanResponder,
            onMoveShouldSetPanResponderCapture: () => this.isMovePanResponder,
            onPanResponderMove: this.onPanResponderMove,
            onPanResponderRelease: this.onPanResponderRelease,
            onPanResponderTerminate: this.onPanResponderTerminate,
            onPanResponderGrant: () => {},
            onPanResponderTerminationRequest: () => false,
            onShouldBlockNativeResponder: () => false,
        });
    }

    componentDidMount() {
        clearInterval(this.autoScrollInterval);
        clearTimeout(this.scaleRecoveryTimeout);
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State) {
        const { containerHeight } = prevState;

        // if dataSource size or item height or separator size changed then apply new container height
        const newContainerHeight = (nextProps.itemHeight + nextProps.separatorHeight) * nextProps.dataSource.length;

        if (newContainerHeight !== containerHeight) {
            return {
                containerHeight: newContainerHeight,
            };
        }

        return null;
    }

    componentDidUpdate(prevProps: Readonly<Props>) {
        const { dataSource } = this.props;
        const { isItemActive } = this.state;

        // if data length changed then reset the state
        if (prevProps.dataSource.length !== dataSource.length) {
            // stop auto scroll if any
            this.stopAutoScroll();

            // clear states
            this.isMovePanResponder = false;
            this.activeItem = undefined;

            // replace with snapshot
            this.itemRefs = new Map(this.itemRefsSnapShot);

            // reset any item ref and remove invalid items
            this.itemRefs.forEach((item, key) => {
                if (item && item.isValid()) {
                    item.resetState();
                } else {
                    this.itemRefs.delete(key);
                }
            });

            // set the state to item is not active
            if (isItemActive) {
                this.setState({
                    isItemActive: false,
                });
            }
        }
    }

    onPanResponderRelease = () => {
        // stop auto scroll
        this.stopAutoScroll();

        // callback
        this.onItemRelease();
    };

    onPanResponderTerminate = () => {
        // TODO: check if this is necessary for android
    };

    onPanResponderMove = (event: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const { itemHeight, separatorHeight } = this.props;
        const { containerHeight } = this.state;
        // if no item active just return
        if (!this.isMovePanResponder) {
            return;
        }

        // track the active item moved
        this.isActiveItemMoved = true;

        // get the current y ax from event
        let { dy } = gestureState;
        const { vy } = gestureState;

        // get current Item status
        const { originTop } = this.activeItem.getCellState();

        // update the dy base on latest auto scroll changes
        if (this.currentAutoScrollChanges) {
            dy += this.currentAutoScrollChanges;
        }

        // prevent component to move to out of boundaries
        const maxBottomBoundary = containerHeight - (itemHeight + separatorHeight);
        if (originTop + dy < 0) {
            dy = -originTop;
        } else if (originTop + dy > maxBottomBoundary) {
            dy = maxBottomBoundary - originTop;
        }

        // if item is out of bound call the alert for auto scroll
        if (this.currentAutoScrollState === AutoScrollState.DISABLED) {
            // calculate distance from top
            const currentElementDistance = originTop + dy - this.currentScrollOffset;

            // move top
            if (currentElementDistance < 0 && -vy > 0.01) {
                this.currentAutoScrollState = AutoScrollState.MOVING_UP;
            } else if (currentElementDistance > this.scrollWindowHeight - (itemHeight + separatorHeight) && vy > 0.01) {
                this.currentAutoScrollState = AutoScrollState.MOVING_DOWN;
            }

            if (this.currentAutoScrollState !== AutoScrollState.DISABLED) {
                this.currentAutoScrollDy = dy;
                this.startAutoScroll();
            }
        }

        // Determine whether we need to disable the auto scrolling
        if (
            (this.currentAutoScrollState === AutoScrollState.MOVING_UP && vy > 0.01) ||
            (this.currentAutoScrollState === AutoScrollState.MOVING_DOWN && -vy > 0.01)
        ) {
            this.currentAutoScrollState = AutoScrollState.DISABLED;
        }

        // check if we are not auto scrolling, then move the item base on the dy
        if (this.currentAutoScrollState === AutoScrollState.DISABLED) {
            this.onItemMove(dy);
        }
    };

    stopAutoScroll = () => {
        if (this.autoScrollInterval) {
            clearInterval(this.autoScrollInterval);
            this.autoScrollInterval = undefined;

            // set the state if not
            if (this.currentAutoScrollState !== AutoScrollState.DISABLED) {
                this.currentAutoScrollState = AutoScrollState.DISABLED;
            }
        }
    };

    startAutoScroll = () => {
        const { itemHeight, separatorHeight } = this.props;
        const { containerHeight } = this.state;

        if (this.autoScrollInterval) {
            return;
        }

        clearInterval(this.autoScrollInterval);

        this.autoScrollInterval = setInterval(() => {
            // state of auto scrolling changed
            if (this.currentAutoScrollState === AutoScrollState.DISABLED) {
                // stop the auto scrolling
                this.stopAutoScroll();
                return;
            }

            const SCROLL_MAX_CHANGE = (2 * (itemHeight + separatorHeight)) / 100;

            let newScrollOffset = undefined as number;

            if (this.currentAutoScrollState === AutoScrollState.MOVING_UP && this.currentScrollOffset > 0) {
                newScrollOffset = this.currentScrollOffset - SCROLL_MAX_CHANGE;
                // do not scroll out of bound
                if (newScrollOffset < 0) {
                    newScrollOffset = 0;
                }
            } else if (
                this.currentAutoScrollState === AutoScrollState.MOVING_DOWN &&
                this.currentScrollOffset < containerHeight
            ) {
                newScrollOffset = this.currentScrollOffset + SCROLL_MAX_CHANGE;
                // do not scroll out of bound
                if (newScrollOffset + this.scrollWindowHeight > containerHeight) {
                    newScrollOffset = containerHeight - this.scrollWindowHeight;
                }
            }

            if (newScrollOffset !== undefined && this.currentScrollOffset !== newScrollOffset) {
                this.currentScrollOffset = newScrollOffset;
                // scroll to the new position
                this.listRef.current?.scrollToOffset({ offset: newScrollOffset, animated: false });

                requestAnimationFrame(() => {
                    if (this.activeItem) {
                        if (this.currentAutoScrollState === AutoScrollState.MOVING_UP) {
                            this.currentAutoScrollDy -= SCROLL_MAX_CHANGE;
                            this.currentAutoScrollChanges -= SCROLL_MAX_CHANGE;
                        } else if (this.currentAutoScrollState === AutoScrollState.MOVING_DOWN) {
                            this.currentAutoScrollDy += SCROLL_MAX_CHANGE;
                            this.currentAutoScrollChanges += SCROLL_MAX_CHANGE;
                        }

                        // move the active item if we are auto scrolling
                        this.onItemMove(this.currentAutoScrollDy);
                    }
                });
            }
        }, 10);
    };

    onItemMove = (dy: number) => {
        const { itemHeight, separatorHeight, dataSource } = this.props;

        // just be sure
        if (!this.activeItem) {
            return;
        }

        // move cell position base on the movement
        this.activeItem.movePosition(dy);

        const { originIndex, currentIndex } = this.activeItem.getCellState();

        // calculate current position
        let position = dy / (itemHeight + separatorHeight);

        // calculate the percent of cover on the new element
        let coverPercent = Math.round((Math.floor(position) - position) * 100) / 100;

        // normalize position, so we know which index we are right now
        if (position < 0) {
            coverPercent += 1;
            position = Math.ceil(position - coverPercent);
        } else {
            coverPercent = Math.abs(coverPercent);
            position = Math.floor(position + coverPercent);
        }

        const moveToIndex = position + originIndex;

        // trigger move when we are moved to new index and also cover percent is more than 40%
        if (
            moveToIndex >= 0 &&
            moveToIndex <= dataSource.length - 1 &&
            moveToIndex !== currentIndex &&
            coverPercent > 0.4
        ) {
            this.moveItem(this.activeItem, currentIndex, moveToIndex);
        }
    };

    moveItem = (item: CellComponent, fromIndex: number, toIndex: number) => {
        const replacedItem = this.itemRefs.get(toIndex);

        if (replacedItem) {
            // move the replaced item to the new position
            replacedItem.moveToIndex(fromIndex);

            // set the current index for the active item
            item.setCurrentIndex(toIndex);

            // replace the positions in item refs
            this.itemRefs.set(toIndex, item);
            this.itemRefs.set(fromIndex, replacedItem);
        }
    };

    onItemLongPress = (index: number) => {
        const { sortable } = this.props;

        // sorting is disable
        if (!sortable) {
            return;
        }

        // scale the component when long press
        const cellItem = this.itemRefs.get(index);

        if (cellItem) {
            // set current active item
            this.activeItem = cellItem;

            // clear prev states
            this.isActiveItemMoved = false;
            this.isMovePanResponder = true;

            // clear auto scroll state
            this.currentAutoScrollChanges = 0;
            this.currentAutoScrollState = AutoScrollState.DISABLED;

            // finally, activate cell
            this.setState(
                {
                    isItemActive: true,
                },
                cellItem.activeCell,
            );
        }
    };

    onDataChange = () => {
        const { dataSource, onDataChange } = this.props;

        const newDataSource = [] as any[];

        for (let i = 0; i < dataSource.length; i++) {
            const item = this.itemRefs.get(i);

            if (item && item.isValid()) {
                newDataSource[i] = dataSource[item.props.index];
            } else {
                newDataSource[i] = dataSource[i];
            }
        }

        if (typeof onDataChange === 'function') {
            onDataChange(newDataSource);
        }
    };

    onItemRelease = () => {
        // disable moving
        this.isMovePanResponder = false;

        // disable item
        this.setState(
            {
                isItemActive: false,
            },
            () => {
                if (this.activeItem) {
                    this.activeItem.deactivateCell(() => {
                        // clear current active item
                        this.activeItem = undefined;

                        // call on data change to send changes
                        this.onDataChange();
                    });
                }
            },
        );
    };

    onItemPressOut = () => {
        const { sortable } = this.props;

        // sorting is disable
        if (!sortable) {
            return;
        }

        this.scaleRecoveryTimeout = setTimeout(() => {
            if (this.isMovePanResponder && !this.isActiveItemMoved) {
                // callback
                this.onItemRelease();
            }
        }, 220);
    };

    onItemPress = (index: number) => {
        const { dataSource, onItemPress } = this.props;

        if (typeof onItemPress === 'function') {
            onItemPress(dataSource[index], index);
        }
    };

    onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (this.currentAutoScrollState === AutoScrollState.DISABLED) {
            this.currentScrollOffset = event.nativeEvent.contentOffset.y;
        }
    };

    onLayout = (event: LayoutChangeEvent) => {
        const { height } = event.nativeEvent.layout;

        if (this.scrollWindowHeight !== height) {
            this.scrollWindowHeight = height;
        }
    };

    renderCellComponent = ({ index, children, cellKey }: { index: number; children: any; cellKey: string }) => {
        const { itemHeight, separatorHeight } = this.props;

        return (
            <CellComponent
                key={`cellComponent-${index}`}
                // key={cellKey}
                testID={cellKey}
                ref={(ref) => {
                    if (!this.itemRefs.has(index) || !this.itemRefs.get(index)?.isValid()) {
                        this.itemRefs.set(index, ref);
                    }
                    // create a fresh snapshot from refs when list size changes
                    this.itemRefsSnapShot.set(index, ref);
                }}
                index={index}
                cellHeight={itemHeight}
                separatorHeight={separatorHeight}
                onPress={this.onItemPress}
                onLongPress={this.onItemLongPress}
                onPressOut={this.onItemPressOut}
            >
                {children}
            </CellComponent>
        );
    };

    render() {
        const { testID, dataSource, keyExtractor, renderItem, renderEmptyList, itemHeight, separatorHeight } =
            this.props;
        const { isItemActive, containerHeight } = this.state;

        return (
            <FlatList
                testID={testID}
                ref={this.listRef}
                style={[styles.container]}
                contentContainerStyle={[styles.contentContainerStyle, { height: containerHeight }]}
                data={dataSource}
                renderItem={renderItem}
                ListEmptyComponent={renderEmptyList}
                CellRendererComponent={this.renderCellComponent}
                keyExtractor={keyExtractor}
                onScroll={this.onScroll}
                onLayout={this.onLayout}
                getItemLayout={(data, index) => ({
                    length: itemHeight + separatorHeight,
                    offset: (itemHeight + separatorHeight) * index,
                    index,
                })}
                scrollEnabled={!isItemActive}
                scrollEventThrottle={1}
                horizontal={false}
                removeClippedSubviews={false}
                alwaysBounceVertical={false}
                bounces={false}
                maxToRenderPerBatch={60}
                initialNumToRender={30}
                /* eslint-disable-next-line react/jsx-props-no-spreading */
                {...this.panResponder.panHandlers}
            />
        );
    }
}
