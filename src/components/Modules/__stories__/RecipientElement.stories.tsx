import React from 'react';
import { View } from 'react-native';
import { action } from '@storybook/addon-actions';
import { storiesOf } from '@storybook/react-native';

import { RecipientElement } from '../RecipientElement';

export const recipientData = {
    id: 'id',
    address: 'rwiETSee2wMz3SBnAG8hkMsCgvGy9LWbZ1',
    avatar: { uri: 'IconProfile' },
    name: 'Wietse',
};

storiesOf('RecipientElement', module)
    // eslint-disable-next-line react-native/no-inline-styles
    .addDecorator((storyFn: any) => <View style={{ flex: 1, justifyContent: 'center' }}>{storyFn()}</View>)
    .add('default', () => <RecipientElement recipient={{ ...recipientData }} onPress={action('onPress')} />)
    .add('WithSource', () => (
        <RecipientElement recipient={{ ...recipientData, source: 'bithomp.com' }} onPress={action('onPress')} />
    ))
    .add('Selected', () => (
        <RecipientElement
            recipient={{ ...recipientData, source: 'bithomp.com' }}
            onPress={action('onPress')}
            selected
        />
    ));
