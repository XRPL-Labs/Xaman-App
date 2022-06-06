/* eslint-disable implicit-arrow-linebreak */
import { storiesOf } from '@storybook/react-native';

import withPropsCombinations from '../../../../storybook/matrix';
import { withContainer } from '../../../../storybook/decoration';

import { InfoMessage } from '../InfoMessage';

const TYPES = ['info', 'warning', 'error', 'success', 'neutral'];
const label = 'Lorem Ipsum is simply dummy text of the printing and typesetting industry';

storiesOf('InfoMessage', module)
    .addDecorator(withContainer)
    .add(
        'All',
        withPropsCombinations(InfoMessage, {
            type: TYPES,
            label: [label],
            icon: ['IconInfo'],
        }),
    )
    .add(
        'Flat',
        withPropsCombinations(InfoMessage, {
            type: TYPES,
            label: [label],
            icon: ['IconInfo'],
            flat: [true],
        }),
    )
    .add(
        'With More info',
        withPropsCombinations(InfoMessage, {
            type: TYPES,
            label: [label],
            icon: ['IconInfo'],
            onMoreButtonPress: [() => {}],
        }),
    );
