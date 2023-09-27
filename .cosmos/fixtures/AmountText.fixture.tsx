import React from 'react';
import { AmountText } from '@components/General/AmountText';

import withPropsCombinations from '../matrix';

const VALUES = ['0.00000000000001', '2.2222', '99999.123456'];

export default {
    original: withPropsCombinations(AmountText, {
        value: VALUES,
    }),
    withPrefix: withPropsCombinations(AmountText, {
        value: VALUES,
        prefix: ['-'],
    }),

    withCurrency: withPropsCombinations(AmountText, {
        value: VALUES,
        currency: ['USD'],
    }),

    discreet: <AmountText currency="USD" value="123" discreet />,
};
