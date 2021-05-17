import React from 'react';
import { action } from '@storybook/addon-actions';
import { storiesOf } from '@storybook/react-native';

import { withBackground, withLocale } from '../../../../storybook/decoration';

import { EventsFilterChip } from '../EventsFilterChip';

export const filters = {
    Amount: '25',
    AmountIndicator: 'Smaller',
    Currency: 'XRP',
    ExpenseType: 'Income',
    TransactionType: 'Payment',
};

storiesOf('EventsFilterChip', module)
    .addDecorator(withBackground)
    .addDecorator(withLocale)
    .add('default', () => <EventsFilterChip filters={filters} onRemovePress={action('onPress')} />);
