/* eslint-disable implicit-arrow-linebreak */
import React from 'react';
import { storiesOf } from '@storybook/react-native';

import { withBackground } from '../../../../storybook/decoration';

import { Avatar } from '../Avatar';

const URI = { uri: 'https://mdbcdn.b-cdn.net/img/new/avatars/2.jpg' };

storiesOf('Avatar', module)
    .addDecorator(withBackground)
    .add('Original', () => <Avatar source={URI} />)
    .add('With Border', () => <Avatar source={URI} border />)
    .add('Big', () => <Avatar source={URI} size={100} />)
    .add('badge', () => <Avatar source={URI} size={100} badge="IconCheckXumm" />)
    .add('badge Color', () => <Avatar source={URI} size={100} badge="IconAlertTriangle" badgeColor="red" />);
