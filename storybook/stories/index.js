import React from 'react';

import { storiesOf } from '@storybook/react-native';
import { action } from '@storybook/addon-actions';

import CenterView from './CenterView';

import { Button } from '../../src/components/General/Button';

storiesOf('Button', module)
    .addDecorator((getStory) => <CenterView>{getStory()}</CenterView>)
    .add('with label', () => <Button onPress={action('clicked-text')} label="Hello Button" />)
    .add('with some emoji', () => <Button onPress={action('clicked-text')} label="😀 😎 👍 💯" />)
    .add('with loading', () => <Button onPress={action('clicked-text')} isLoading label="Hello Button" />)
    .add('with disabled', () => <Button onPress={action('clicked-text')} isDisabled label="Hello Button" />);
