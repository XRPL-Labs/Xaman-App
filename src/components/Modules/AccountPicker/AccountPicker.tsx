import { isEqual, findIndex } from 'lodash';

import React, { Component } from 'react';
import { View, Text, ViewStyle } from 'react-native';

import { Navigator } from '@common/helpers/navigator';

import { AppScreens } from '@common/constants';

import { TouchableDebounce, Icon } from '@components/General';

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

        Navigator.showOverlay(AppScreens.Overlay.SelectAccount, {
            selected: selectedItem,
            accounts,
            onSelect: this.onSelect,
            onClose: this.onPickerClose,
        });
    };

    render() {
        const { accounts, containerStyle, selectedItem } = this.props;

        const { expanded } = this.state;

        if (!accounts || accounts.length === 0 || !selectedItem) {
            return (
                <View style={[styles.pickerContainer, containerStyle]}>
                    {/* eslint-disable-next-line */}
                    <View style={AppStyles.row}>
                        <Text style={[AppStyles.p, AppStyles.strong]}>No item available</Text>
                    </View>
                </View>
            );
        }

        return (
            <TouchableDebounce activeOpacity={0.9} onPress={this.showPicker} style={styles.pickerContainer}>
                <View style={AppStyles.row}>
                    <View style={AppStyles.flex1}>
                        <Text numberOfLines={1} style={styles.accountItemTitle}>
                            {selectedItem.label}
                        </Text>
                        <Text style={styles.accountItemSub} adjustsFontSizeToFit numberOfLines={1}>
                            {selectedItem.address}
                        </Text>
                    </View>
                    {accounts.length > 1 && (
                        <TouchableDebounce style={styles.collapseButton} onPress={this.showPicker}>
                            <Icon
                                name={expanded ? 'IconChevronUp' : 'IconChevronDown'}
                                size={20}
                                style={styles.collapseIcon}
                            />
                        </TouchableDebounce>
                    )}
                </View>
            </TouchableDebounce>
        );
    }
}

export default AccountPicker;
