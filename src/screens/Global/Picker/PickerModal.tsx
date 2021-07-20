/**
 * Picker modal
 */

import { isFunction } from 'lodash';
import React, { Component } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';

import { AppScreens } from '@common/constants';
import { Navigator } from '@common/helpers/navigator';

import { Header, Icon } from '@components/General';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    title?: string;
    description?: string;
    selected?: any;
    items: Array<{ value: any; title: string }>;
    onSelect?: (item: { value: any; title: string }) => void;
}

export interface State {}

/* Component ==================================================================== */
class PickerModal extends Component<Props, State> {
    static screenName = AppScreens.Global.Picker;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    onSelect = (selectedItem: any) => {
        const { onSelect } = this.props;

        Navigator.pop();

        if (isFunction(onSelect)) {
            onSelect(selectedItem);
        }
    };

    renderItem = ({ index, item }: { index: number; item: any }) => {
        const { selected } = this.props;

        return (
            <TouchableOpacity
                testID={`${item.value}-item`}
                key={index}
                style={styles.rowContainer}
                onPress={() => {
                    this.onSelect(item);
                }}
            >
                <View style={[AppStyles.flex4, AppStyles.leftAligned]}>
                    <Text style={AppStyles.subtext}>{item.title}</Text>
                </View>
                {selected === item.value && (
                    <View style={[AppStyles.flex1, AppStyles.rightAligned]}>
                        <Icon size={20} style={styles.checkIcon} name="IconCheck" />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    render() {
        const { title, items, description } = this.props;

        return (
            <View testID="picker-modal" style={styles.container}>
                <Header
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: () => {
                            Navigator.pop();
                        },
                    }}
                    centerComponent={{ text: title }}
                />
                {description && (
                    <View style={AppStyles.paddingSml}>
                        <Text style={styles.descriptionText}>{description}</Text>
                    </View>
                )}
                <FlatList data={items} renderItem={this.renderItem} keyExtractor={(i) => `${i.value}`} />
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default PickerModal;
