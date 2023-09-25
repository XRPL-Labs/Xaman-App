/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable import/no-relative-packages */

import React from 'react';
import { storiesOf } from '@storybook/react-native';

import { withContainer } from '../../../../storybook/decoration';

import { Avatar } from '../Avatar';

const URI = { uri: 'https://xumm.app/assets/icons/currencies/ex-bitstamp.png' };

storiesOf('Avatar', module)
    .addDecorator(withContainer)
    .add('Original', () => <Avatar source={URI} />)
    .add('With Border', () => <Avatar source={URI} border />)
    .add('Big', () => <Avatar source={URI} size={100} />)
    .add('badge', () => <Avatar source={URI} size={100} badge="IconCheckXaman" />)
    .add('badge Color', () => <Avatar source={URI} size={100} badge="IconAlertTriangle" badgeColor="red" />);
