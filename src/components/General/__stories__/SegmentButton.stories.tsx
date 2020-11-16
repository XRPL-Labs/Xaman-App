/* eslint-disable react-native/no-color-literals */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable implicit-arrow-linebreak */

import React from 'react';
import { View } from 'react-native';
import { action } from '@storybook/addon-actions';
import { storiesOf } from '@storybook/react-native';

import { SegmentButton } from '../SegmentButton';

const BUTTONS = ['All', 'Planned', 'Requests'];

storiesOf('SegmentButton', module)
    .addDecorator((storyFn: any) => (
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#F0F3FF' }}>{storyFn()}</View>
    ))
    .add('Three Button', () => <SegmentButton buttons={BUTTONS} onPress={action('onPress')} />);
