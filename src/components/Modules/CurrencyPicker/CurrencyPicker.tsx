import React, { Component } from 'react';
import { View, Text, ViewStyle } from 'react-native';

import { AppScreens } from '@common/constants';

import { Navigator } from '@common/helpers/navigator';

import { AccountModel, TrustLineModel } from '@store/models';

import { TouchableDebounce, Icon } from '@components/General';
import { CurrencyItem } from '@components/Modules/CurrencyPicker/CurrencyItem';

import { SelectCurrencyOverlayProps } from '@screens/Overlay/SelectCurrency';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    account: AccountModel;
    currencies: Array<TrustLineModel | string>;
    selectedItem?: TrustLineModel | string;
    onSelect?: (item: any) => void;
    containerStyle?: ViewStyle;
    timestamp?: number;
}

interface State {
    expanded: boolean;
}

/* Component ==================================================================== */
class CurrencyPicker extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            expanded: false,
        };
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
        const { account, selectedItem, currencies } = this.props;
        const { expanded } = this.state;

        if (expanded || !Array.isArray(currencies) || currencies.length <= 1) {
            return;
        }

        this.setState({
            expanded: true,
        });

        Navigator.showOverlay<SelectCurrencyOverlayProps>(AppScreens.Overlay.SelectCurrency, {
            account,
            currencies,
            selectedItem,
            onSelect: this.onSelect,
            onClose: this.onPickerClose,
        });
    };

    render() {
        const { account, currencies, containerStyle, selectedItem } = this.props;
        const { expanded } = this.state;

        if (!currencies || currencies.length === 0 || !selectedItem) {
            return (
                <View style={containerStyle}>
                    {/* eslint-disable-next-line */}
                    <View style={[AppStyles.row, { paddingLeft: 10 }]}>
                        <Text style={[AppStyles.p, AppStyles.strong]}>No Item available</Text>
                    </View>
                </View>
            );
        }

        return (
            <TouchableDebounce
                activeOpacity={0.9}
                onPress={this.showPicker}
                style={[styles.pickerContainer]}
            >
                <View style={AppStyles.row}>
                    <View style={AppStyles.flex1}>
                        <CurrencyItem account={account} item={selectedItem} />
                    </View>
                    {currencies.length > 1 && (
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

export default CurrencyPicker;
