/* eslint-disable spellcheck/spell-checker */
import React from 'react';
import { View } from 'react-native';
import { action } from '@storybook/addon-actions';
import { storiesOf } from '@storybook/react-native';

import { EventsFilterChip } from '../EventsFilterChip';

export const filters = {
    Amount: '25',
    AmountIndicator: 'Smaller',
    Currency: 'XRP',
    ExpenseType: 'Income',
    TransactionType: 'Payment',
};

storiesOf('EventsFilterChip', module)
    // eslint-disable-next-line react-native/no-inline-styles
    .addDecorator((storyFn: any) => <View style={{ flex: 1, justifyContent: 'center' }}>{storyFn()}</View>)
    .add('default', () => <EventsFilterChip filters={filters} onRemovePress={action('onPress')} />);
