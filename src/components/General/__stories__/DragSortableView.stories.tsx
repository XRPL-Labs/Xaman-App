/* eslint-disable react-native/no-color-literals */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable import/no-relative-packages */

import React, { Component } from 'react';
import { View, Text, LogBox } from 'react-native';
import { storiesOf } from '@storybook/react-native';

import { AppSizes } from '@theme';

import { SortableFlatList } from '../SortableFlatList';

import { withBackground } from '../../../../storybook/decoration';

LogBox.ignoreLogs(['EventEmitter', 'Require cycle']);

const DATASOURCE = Array(1000).fill('ITEM ');

const ITEM_HEIGHT = 100;
const ITEM_WIDTH = AppSizes.screen.width * 0.9;

class Item extends Component<any, any> {
    render() {
        const { item, index } = this.props;
        return (
            <View
                key={`item-${index}`}
                style={{
                    height: ITEM_HEIGHT,
                    width: ITEM_WIDTH,
                    marginHorizontal: 20,
                    backgroundColor: 'silver',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Text>{`${item} ${index}`}</Text>
            </View>
        );
    }
}

storiesOf('SortableFlatList', module)
    .addDecorator(withBackground)
    .add('Default', () => (
        <View style={{ flex: 1 }}>
            <SortableFlatList
                itemHeight={ITEM_HEIGHT}
                dataSource={DATASOURCE}
                keyExtractor={(item, index) => `${item}${index}`}
                renderItem={({ item, index }) => <Item item={item} index={index} />}
                sortable={false}
            />
        </View>
    ));
