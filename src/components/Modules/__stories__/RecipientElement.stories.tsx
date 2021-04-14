/* eslint-disable spellcheck/spell-checker */
import React from 'react';
import { action } from '@storybook/addon-actions';
import { storiesOf } from '@storybook/react-native';

import { withBackground } from '../../../../storybook/decoration';

import { RecipientElement } from '../RecipientElement';

export const recipientData = {
    id: 'id',
    address: 'rwiETSee2wMz3SBnAG8hkMsCgvGy9LWbZ1',
    name: 'Wietse',
    source: 'internal:contacts',
};

storiesOf('RecipientElement', module)
    .addDecorator(withBackground)
    .add('default', () => <RecipientElement recipient={{ ...recipientData }} onPress={action('onPress')} />)
    .add('WithSource', () => (
        <RecipientElement
            recipient={{ ...recipientData, source: 'internal:bithomp.com' }}
            onPress={action('onPress')}
        />
    ))
    .add('Selected', () => (
        <RecipientElement
            recipient={{ ...recipientData, source: 'internal:bithomp.com' }}
            onPress={action('onPress')}
            selected
        />
    ));
