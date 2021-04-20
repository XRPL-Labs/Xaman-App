/* eslint-disable react-native/no-color-literals */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable implicit-arrow-linebreak */

import React from 'react';
import { action } from '@storybook/addon-actions';
import { storiesOf } from '@storybook/react-native';

import { SegmentButton } from '../SegmentButton';

import { withBackground } from '../../../../storybook/decoration';

const BUTTONS = ['All', 'Planned', 'Requests'];

storiesOf('SegmentButton', module)
    .addDecorator(withBackground)
    .add('Three Button', () => <SegmentButton buttons={BUTTONS} onPress={action('onPress')} />);
