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
    View,
    Text,
    InteractionManager,
} from 'react-native';

import CellComponent from '@components/General/SortableFlatList/CellComponent';

import styles from './styles';
import { TouchableDebounce } from '../TouchableDebounce';
import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';
import { AccountRepository, CoreRepository } from '@store/repositories';

import tokenItemStyles from '@components/Modules/AssetsList/Tokens/TokenItem/styles';

import Localize from '@locale';
import { XAppOrigin } from '@common/libs/payload';
import { OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';
import { Avatar } from '../Avatar';
import { LoadingIndicator } from '../LoadingIndicator';
import BackendService from '@services/BackendService';
import AppService, { AppStateStatus } from '@services/AppService';

// import { AppStyles } from '@theme/index';

/* Types ==================================================================== */
interface Props {
    topFade: boolean;
    accWorthEnabled: boolean;
    testID?: string;
    itemHeight: number;
    separatorHeight?: number;
    dataSource: Array<any>;
    sortable?: boolean;
    firstItemExtraHeight?: number;
    renderItem: ListRenderItem<any> | null | undefined;
    renderEmptyList?: React.ComponentType<any> | React.ReactElement | null | undefined;
    onItemPress?: (item: any, index: number) => void;
    keyExtractor?: ((item: any, index: number) => string) | undefined;
    onDataChange?: (dataSource: Array<any>) => void;
    updateTokenPrices?: (data: any) => void;
    lineWorthLoading?: (loading: boolean) => void;
}

interface State {
    containerHeight: number;
    isItemActive: boolean;
    accWorthIdentifier: string;
    accWorthTitle: string;
    accWorthNativeAsset: string;
    accWorthAmount: number;
    accWorthLoading: boolean;
    currencyRate: {
        code: string;
        rate: number;
        symbol: string;
        lastSync: number;
    };
}

enum AutoScrollState {
    DISABLED = 'DISABLED',
    MOVING_UP = 'MOVING_UP',
    MOVING_DOWN = 'MOVING_DOWN',
}

/* Component ==================================================================== */
export default class SortableFlatList extends Component<Props, State> {
    private itemRefs: Map<number, CellComponent | null>;
    private itemRefsSnapShot: Map<number, CellComponent | null>;
    private activeItem: CellComponent | undefined;
    private listRef: React.RefObject<FlatList>;

    private scaleRecoveryTimeout: ReturnType<typeof setTimeout> | undefined;
    private autoScrollInterval: ReturnType<typeof setTimeout> | undefined;
    private accountWorthInterval: ReturnType<typeof setTimeout> | undefined;
    
    private currentAccountWorthAccount: string = '';

    private panResponder: PanResponderInstance;
    private isMovePanResponder: boolean;
    private isActiveItemMoved = false;

    private scrollWindowHeight: number;
    private currentScrollOffset: number;
    private currentAutoScrollDy: number;
    private currentAutoScrollChanges: number;

    private currentAutoScrollState: AutoScrollState;

    declare readonly props: Props & Required<Pick<Props, keyof typeof SortableFlatList.defaultProps>>;

    static defaultProps: Partial<Props> = {
        separatorHeight: 0,
        sortable: true,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            containerHeight: (props.itemHeight + props.separatorHeight!) *
                (props.dataSource.length + 1) +
                (props.firstItemExtraHeight || 0) - 10,
            isItemActive: false,
            accWorthIdentifier: '',
            accWorthTitle: '',
            accWorthNativeAsset: '',
            accWorthAmount: 0,
            accWorthLoading: true,
            currencyRate: {
                code: '',
                rate: 0,
                symbol: '',
                lastSync: 0,
            },
        };

        this.itemRefs = new Map();
        this.itemRefsSnapShot = new Map();
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
            onMoveShouldSetPanResponder: (evt, { dx, dy }) => {
                if (dx > 0 || dy > 0) {
                    return this.isMovePanResponder;
                }
                return false;
            },
            onMoveShouldSetPanResponderCapture: (evt, { dx, dy }) => {
                if (dx > 0 || dy > 0) {
                    return this.isMovePanResponder;
                }
                return false;
            },
            onPanResponderMove: this.onPanResponderMove,
            onPanResponderRelease: this.onPanResponderRelease,
            onPanResponderTerminate: this.onPanResponderTerminate,
            onPanResponderGrant: () => {},
            onPanResponderTerminationRequest: () => false,
            onShouldBlockNativeResponder: () => false,
        });
    }

    updateSettingsHandler = (a: any) => {
        const { lineWorthLoading } = this.props;

        const settings = CoreRepository.getSettings();

        // Todo: fetch new value
        this.setState({
            accWorthNativeAsset: settings.currency,
            accWorthLoading: true,
        });

        if (lineWorthLoading) {
            lineWorthLoading(true);
        }

        this.fetchAccountWorth(a, 'UPDATE_SETTINGS_HANDLER');
    };

    fetchAccountWorth = (
        a?: any,
        origin: 'UNKNOWN' | 'UPDATE_SETTINGS_HANDLER' | 'INTERVAL' | 'COMPONENT_MOUNT' | 'APPSTATE_CHANGE' =
            'UNKNOWN',
    ) => {
        const { updateTokenPrices, lineWorthLoading, accWorthEnabled } = this.props;
        const { accWorthLoading, accWorthAmount } = this.state;

        if (!accWorthEnabled) {
            return;
        }

        const settings = CoreRepository.getSettings();

        const isValidNetwork = settings.network?.key === 'MAINNET' || settings.network?.key === 'XAHAU';
        if ((!settings.accountWorthActive && !settings.showPerAssetWorth) || !isValidNetwork) {
            this.setState({
                accWorthLoading: true,
                accWorthAmount: 0,
            });

            return;
        }

        if (settings?.account?.address !== this.currentAccountWorthAccount) {
            // Account changed, current values are no longer relevant
            // console.log('Account changed, current values are no longer relevant')
            this.setState({
                accWorthLoading: true,
                accWorthAmount: 0,
            });
        }

        if (a && a?.address) {
            if (a.address !== settings?.account?.address) {
                // console.log('returning early, not fetching worth, address mismatch')
                return;
            }
        }

        clearInterval(this.accountWorthInterval);
        this.accountWorthInterval = setInterval(() => {
            this.fetchAccountWorth(undefined, 'INTERVAL');
        }, 30 * 1000);

        if (accWorthAmount > 0 && accWorthLoading) {
            this.setState({
                accWorthLoading: false,
            });
        }

        // console.log('fetchAccountWorth', settings.account.address);
        Promise.all([
            BackendService.getAccountWorth(settings?.account?.address, settings.network.key, settings.currency, origin),
            BackendService.getCurrencyRate(settings.currency),
        ]).then(([res, rate]) => {
            this.currentAccountWorthAccount = settings?.account?.address;

            this.setState({
                accWorthAmount: res.totalValue,
                accWorthLoading: false,
                currencyRate: rate,
            });
            if (lineWorthLoading) {
                lineWorthLoading(false);
            }
            if (updateTokenPrices) {
                updateTokenPrices({
                    ...res,
                    rate,
                });
            }
        })
        .catch(() => {
            //
            this.setState({
                accWorthLoading: false,
            });
        });
    };

    componentDidMount() {
        clearInterval(this.autoScrollInterval);
        clearInterval(this.accountWorthInterval);
        clearTimeout(this.scaleRecoveryTimeout);

        InteractionManager.runAfterInteractions(() => { 
            const settings = CoreRepository.getSettings();

            this.setState({
                accWorthIdentifier: settings.accountWorthInfo.split('|')[0],
                accWorthTitle: settings.accountWorthInfo.split('|')[1],
                accWorthNativeAsset: settings.currency,
            });

            this.fetchAccountWorth(undefined, 'COMPONENT_MOUNT');

            CoreRepository.on('updateSettings', this.updateSettingsHandler);
            AccountRepository.on('accountUpdate', this.updateSettingsHandler);
            AppService.addListener('appStateChange', this.appStateChange);
        });
    }

    appStateChange = (newState: AppStateStatus) => {
        if (newState === AppStateStatus.Active) {
            // console.log('App active, fetch')
            return this.fetchAccountWorth(undefined, 'APPSTATE_CHANGE');
        }

        // console.log('App inactive, clear')
        return clearInterval(this.accountWorthInterval);
    };

    componentWillUnmount() {
        clearInterval(this.accountWorthInterval);
        CoreRepository.off('updateSettings', this.updateSettingsHandler);
        AccountRepository.off('accountUpdate', this.updateSettingsHandler);
        AppService.removeListener('appStateChange', this.appStateChange);
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State) {
        const { containerHeight } = prevState;

        // if dataSource size or item height or separator size changed then apply new container height
        let newContainerHeight = (nextProps.itemHeight + nextProps.separatorHeight!) *
            (nextProps.dataSource.length + 1) +
            (nextProps.firstItemExtraHeight || 0) - 10;
        
        if (nextProps.sortable) {
            newContainerHeight -= -40;
        }

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
            this.itemRefs.forEach(async (item, key) => {
                if (item && (await item.isValid())) {
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
        if (!this.isMovePanResponder || !this.activeItem) {
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

            let newScrollOffset;

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

            if (typeof newScrollOffset !== 'undefined' && this.currentScrollOffset !== newScrollOffset) {
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

    onDataChange = async () => {
        const { dataSource, onDataChange } = this.props;

        const newDataSource = [] as any[];

        for (let i = 0; i < dataSource.length; i++) {
            const item = this.itemRefs.get(i);

            if (item && (await item.isValid())) {
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
        const { itemHeight, separatorHeight, firstItemExtraHeight } = this.props;

        return (
            <CellComponent
                key={`cellComponent-${index}-${firstItemExtraHeight}`}
                // key={cellKey}
                testID={cellKey}
                ref={async (ref) => {
                    if (!this.itemRefs.has(index) || !(await this.itemRefs.get(index)?.isValid())) {
                        this.itemRefs.set(index, ref);
                    }
                    // create a fresh snapshot from refs when list size changes
                    this.itemRefsSnapShot.set(index, ref);
                }}
                index={index}
                cellHeight={itemHeight}
                firstItemExtraHeight={firstItemExtraHeight}
                separatorHeight={separatorHeight}
                onPress={this.onItemPress}
                onLongPress={this.onItemLongPress}
                onPressOut={this.onItemPressOut}
            >
                <View style={[
                    index === 0 && {
                        paddingTop: (firstItemExtraHeight || 0) / 2,
                        paddingBottom: (firstItemExtraHeight || 0) / 2,
                    },
                ]}>
                    {index === 0 && cellKey === 'token-native' && this.renderAssetListxApp()}
                    {children}
                </View>
            </CellComponent>
        );
    };

    renderAssetListxApp = () => {
        const {
            accWorthIdentifier,
            accWorthTitle,
            accWorthNativeAsset,
            accWorthAmount,
            accWorthLoading,
            currencyRate,
        } = this.state;
        const { accWorthEnabled } = this.props;

        if (!accWorthEnabled) {
            return null;
        }

        const asset = currencyRate.symbol && currencyRate.symbol !== ''
            ? currencyRate.symbol
            : currencyRate.code && currencyRate.code !== ''
                ? currencyRate.code
                : accWorthNativeAsset.toUpperCase();

        return (
            <TouchableDebounce key='xapp-asset' onPress={() => {
                Navigator.showModal(
                    AppScreens.Modal.XAppBrowser,
                    {
                        identifier: accWorthIdentifier,
                        origin: XAppOrigin.XUMM,
                    },
                    {
                        modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                        modalPresentationStyle: OptionsModalPresentationStyle.overFullScreen,
                    },
                );
            }} activeOpacity={0.7}>
                <View
                    testID='accountworthxapp'
                    style={[
                        tokenItemStyles.currencyItem,
                        // eslint-disable-next-line react-native/no-inline-styles
                        { marginTop: -32 },
                        // eslint-disable-next-line react-native/no-inline-styles
                        { marginBottom: 20 },
                    ]}
                >
                    <View style={[tokenItemStyles.xAppTokenContainer]}>
                        <View style={tokenItemStyles.tokenAvatarContainer}>
                            <Avatar
                                source={{ uri: `https://xaman.app/icon/xapp/${accWorthIdentifier}` }}
                                size={35}
                            />
                        </View>
                        <View>
                            <Text numberOfLines={1} style={[
                                tokenItemStyles.currencyLabel,
                                tokenItemStyles.xAppLabel,
                            ]} ellipsizeMode="middle">
                                {accWorthTitle}
                            </Text>
                        </View>
                    </View>
                    <View style={[tokenItemStyles.balanceContainer]}>
                        {accWorthLoading && accWorthAmount === 0 && <LoadingIndicator size='small' />}
                        {(!accWorthLoading || accWorthAmount > 0) && (
                            <>
                                <Text style={tokenItemStyles.xAppBalanceContainerCurrency}>{
                                    asset
                                }</Text>
                                <Text style={tokenItemStyles.xAppBalanceContainer}>{
                                    Localize.formatNumber(accWorthAmount, accWorthAmount > 1000 ? 0 : 2, true)
                                }</Text>
                            </>
                        )}
                    </View>
                </View>
            </TouchableDebounce>
        );
    };

    render() {
        const {
            testID,
            dataSource,
            keyExtractor,
            renderItem,
            renderEmptyList,
            itemHeight,
            separatorHeight,
            topFade,
            accWorthEnabled,
        } =
            this.props;
        const { isItemActive, containerHeight } = this.state;

        return (
            <View style={[ topFade && styles.topShadowContainer ]}>
                <View style={[ topFade && styles.topShadow ]} />
                <FlatList
                    testID={testID}
                    ref={this.listRef}
                    key={`tokenlistflat-w-${accWorthEnabled ? 1 : 0}`}
                    style={[
                        styles.container,
                        // AppStyles.borderRed,
                    ]}
                    contentContainerStyle={[
                        styles.contentContainerStyle,
                        { height: containerHeight !== 0 ? containerHeight : undefined },
                    ]}
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
            </View>
        );
    }
}
