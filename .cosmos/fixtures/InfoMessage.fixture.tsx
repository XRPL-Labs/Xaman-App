import React from 'react';

import { InfoMessage } from '@components/General/InfoMessage';
import withPropsCombinations from '../matrix';

const TYPES = ['info', 'warning', 'error', 'success', 'neutral'];
const label = 'Lorem Ipsum is simply dummy text of the printing and typesetting industry';

export default {
    All: withPropsCombinations(InfoMessage, {
        type: TYPES,
        label: [label],
        icon: ['IconInfo'],
    }),

    Flat: withPropsCombinations(InfoMessage, {
        type: TYPES,
        label: [label],
        icon: ['IconInfo'],
        flat: [true],
    }),

    'With More info': withPropsCombinations(InfoMessage, {
        type: TYPES,
        label: [label],
        icon: ['IconInfo'],
        onMoreButtonPress: [() => {}],
    }),
};
