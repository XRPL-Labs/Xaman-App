import { isEqual, findIndex } from 'lodash';

import React, { Component } from 'react';
import { View, Text, ViewStyle, TouchableOpacity } from 'react-native';

import { Navigator } from '@common/helpers/navigator';

import { AppScreens } from '@common/constants';

import { Icon } from '@components/General/Icon';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    accounts: any;
    containerStyle?: ViewStyle;
    selectedItem?: any;
    onSelect?: (item: any) => void;
}

interface State {
    expanded: boolean;
}

/* Component ==================================================================== */
class AccountPicker extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            expanded: false,
        };
    }

    static getDerivedStateFromProps(nextProps: Props) {
        const { selectedItem, accounts } = nextProps;

        let selected = 0;

        if (selectedItem) {
            selected = findIndex(accounts, (item: any) => {
                return isEqual(item.address, selectedItem.address);
            });
        }

        if (selected !== -1) {
            return {
                selectedIndex: selected,
            };
        }

        return null;
    }

    onSelect = (item: any) => {
        const { onSelect } = this.props;

        if (typeof onSelect === 'function') {
            onSelect(item);
        }
    };

    onPickerClose = () => {
        this.setState({
            expanded: false,
        });
    };

    showPicker = () => {
        const { selectedItem, accounts } = this.props;
        const { expanded } = this.state;

        if (expanded || typeof accounts.length !== 'number' || accounts.length <= 1) {
            return;
        }

        this.setState({
            expanded: true,
        });

        Navigator.showOverlay(
            AppScreens.Overlay.SelectAccount,
            {
                layout: {
                    backgroundColor: 'transparent',
                    componentBackgroundColor: 'transparent',
                },
            },
            { selected: selectedItem, accounts, onSelect: this.onSelect, onClose: this.onPickerClose },
        );
    };

    render() {
        const { accounts, containerStyle, selectedItem } = this.props;

        const { expanded } = this.state;

        if (!accounts || accounts.length === 0) {
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
            <TouchableOpacity activeOpacity={0.9} onPress={this.showPicker} style={[styles.pickerContainer]}>
                <View style={[AppStyles.row]}>
                    <View style={[AppStyles.flex1]}>
                        <Text style={[styles.accountItemTitle]}>{selectedItem.label}</Text>
                        <Text style={[styles.accountItemSub]} adjustsFontSizeToFit numberOfLines={1}>
                            {selectedItem.address}
                        </Text>
                    </View>
                    {accounts.length > 1 && (
                        <TouchableOpacity style={[styles.collapseButton]} onPress={this.showPicker}>
                            <Icon
                                name={expanded ? 'IconChevronUp' : 'IconChevronDown'}
                                size={20}
                                style={styles.collapseIcon}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    }
}

export default AccountPicker;
