import { isEqual, findIndex, isEmpty } from 'lodash';

import React, { Component } from 'react';
import {
    View,
    Text,
    ViewStyle,
    Modal,
    FlatList,
    TouchableOpacity,
    TouchableHighlight,
    LayoutChangeEvent,
} from 'react-native';

import { Icon } from '@components/Icon';

import { AppStyles, AppColors } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    items: any;
    containerStyle?: ViewStyle;
    selectedItem?: any;
    renderItem: (item: any, selected?: boolean) => React.ReactElement | null;
    onSelect?: (item: any) => void;
    onExpand?: () => void;
    keyExtractor?: (item: any) => string;
}

interface State {
    expanded: boolean;
    itemHeight: number;
    itemWidth: number;
    pageX: number;
    pageY: number;
    selectedIndex: number;
}

/* Component ==================================================================== */
class AccordionPicker extends Component<Props, State> {
    pickerContainer: View;

    constructor(props: Props) {
        super(props);

        this.state = {
            expanded: false,
            itemHeight: undefined,
            itemWidth: undefined,
            pageX: undefined,
            pageY: undefined,
            selectedIndex: 0,
        };
    }

    componentDidMount() {
        const { selectedItem, keyExtractor, items } = this.props;

        let selected = 0;

        if (selectedItem && keyExtractor) {
            selected = findIndex(items, (item: any) => {
                return isEqual(keyExtractor(item), keyExtractor(selectedItem));
            });
        }

        if (selected) {
            this.setState({
                selectedIndex: selected,
            });
        }
    }

    public close = () => {
        const { expanded } = this.state;

        if (expanded) {
            this.setState({
                expanded: false,
            });
        }
    };

    public open = () => {
        const { expanded } = this.state;
        const { onExpand } = this.props;

        if (!expanded) {
            this.setState({
                expanded: true,
            });

            if (onExpand) {
                onExpand();
            }
        }
    };

    public setSelectedIndex = (index: number) => {
        this.setState({
            selectedIndex: index,
        });
    };

    public updateContainerPosition = () => {
        this.setContainerPosition();
    };

    toggle = () => {
        const { items } = this.props;
        const { expanded } = this.state;

        if (items.length < 2) return;

        if (expanded) {
            this.close();
        } else {
            this.open();
        }
    };

    setItemHeight = (event: LayoutChangeEvent) => {
        const { itemHeight } = this.state;
        const { height, width } = event.nativeEvent.layout;

        if (height === 0 || itemHeight) return;

        this.setState({ itemHeight: height + 2, itemWidth: width + 10 });
    };

    setContainerPosition = () => {
        if (this.pickerContainer) {
            this.pickerContainer.measure((x, y, width, height, pageX, pageY) => {
                this.setState({
                    pageX,
                    pageY,
                });
            });
        }
    };

    onSelect = (item: any, index: number) => {
        const { onSelect } = this.props;

        this.setState({
            selectedIndex: index,
        });

        this.close();

        if (onSelect) {
            onSelect(item);
        }
    };

    renderRow = ({ index, item }: any) => {
        const { renderItem } = this.props;
        const { selectedIndex, expanded } = this.state;

        return (
            <TouchableHighlight
                underlayColor={AppColors.light}
                style={[
                    index === selectedIndex ? styles.pickerDropDownItemActive : styles.pickerDropDownItem,
                    AppStyles.centerContent,
                ]}
                onPress={() => this.onSelect(item, index)}
            >
                <View style={[AppStyles.row]}>
                    <View style={[AppStyles.flex1]}>{renderItem(item, index === selectedIndex)}</View>
                    {index === selectedIndex && expanded && (
                        <View style={[styles.checkMarkContainer]}>
                            <Icon name="IconCheck" size={25} style={styles.checkMarkIcon} />
                        </View>
                    )}
                </View>
            </TouchableHighlight>
        );
    };

    render() {
        const { containerStyle, renderItem, keyExtractor, items } = this.props;

        const { expanded, itemHeight, itemWidth, pageX, pageY, selectedIndex } = this.state;

        if (isEmpty(items)) {
            return (
                <View style={[containerStyle]}>
                    {/* eslint-disable-next-line */}
                    <View style={[AppStyles.row, { paddingLeft: 10 }]}>
                        <Text style={[AppStyles.p, AppStyles.strong]}>No Item available</Text>
                    </View>
                </View>
            );
        }

        return (
            <View
                onLayout={this.setContainerPosition}
                ref={r => {
                    this.pickerContainer = r;
                }}
                style={[
                    styles.pickerContainer,
                    containerStyle,
                    items.length > 1 && expanded && styles.pickerContainerExpanded,
                ]}
            >
                <TouchableOpacity
                    activeOpacity={0.9}
                    onLayout={this.setItemHeight}
                    onPress={this.toggle}
                    style={[styles.pickerDropDownItem, AppStyles.centerContent]}
                >
                    <View style={[AppStyles.row]}>
                        <View style={AppStyles.flex1}>{renderItem(items[selectedIndex])}</View>
                        {items.length > 1 && (
                            <TouchableOpacity style={[styles.collapseButton]} onPress={this.toggle}>
                                <Icon
                                    name={expanded ? 'IconChevronUp' : 'IconChevronDown'}
                                    size={20}
                                    style={styles.collapseIcon}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                </TouchableOpacity>

                <Modal visible={expanded} transparent onRequestClose={this.close}>
                    <View
                        style={[styles.overlay]}
                        onStartShouldSetResponder={() => true}
                        onResponderRelease={this.close}
                    >
                        <View
                            style={[
                                styles.pickerDropDownContainer,
                                {
                                    top: itemHeight + pageY,
                                    left: pageX,
                                    height: itemHeight * items.length + 10,
                                    width: itemWidth,
                                },
                            ]}
                        >
                            <FlatList data={items} renderItem={this.renderRow} keyExtractor={keyExtractor} />
                        </View>
                    </View>
                </Modal>
            </View>
        );
    }
}

export default AccordionPicker;
