import { storiesOf } from '@storybook/react-native';

import withPropsCombinations from '../../../../storybook/matrix';
import { withBackground, withLocale } from '../../../../storybook/decoration';

import { AmountText } from '../AmountText';

const VALUES = ['0.00000000000001', '2.2222', '99999.123456'] as const;

storiesOf('AmountText', module)
    .addDecorator(withLocale)
    .addDecorator(withBackground)
    .add(
        'WithValue',
        withPropsCombinations(AmountText, {
            value: VALUES,
        }),
    )
    .add(
        'WithCurrency',
        withPropsCombinations(AmountText, {
            value: VALUES,
            currency: ['XRP'],
        }),
    )
    .add(
        'WithCurrencyPrefix',
        withPropsCombinations(AmountText, {
            value: VALUES,
            currency: ['XRP'],
            prefix: ['~'],
        }),
    );
