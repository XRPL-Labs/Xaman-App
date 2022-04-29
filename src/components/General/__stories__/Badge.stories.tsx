/* eslint-disable implicit-arrow-linebreak */

import { storiesOf } from '@storybook/react-native';

import withPropsCombinations from '../../../../storybook/matrix';
import { withContainer } from '../../../../storybook/decoration';

import { Badge } from '../Badge';

const SIZES = ['small', 'medium', 'large'] as const;

storiesOf('Badge', module)
    .addDecorator(withContainer)
    .add(
        'Bithomp',
        withPropsCombinations(Badge, {
            size: SIZES,
            type: ['bithomp'],
        }),
    )
    .add(
        'XRPScan',
        withPropsCombinations(Badge, {
            size: SIZES,
            type: ['xrpscan'],
        }),
    )
    .add(
        'XRPLNS',
        withPropsCombinations(Badge, {
            size: SIZES,
            type: ['xrplns'],
        }),
    )
    .add(
        'PayId',
        withPropsCombinations(Badge, {
            size: SIZES,
            type: ['payid'],
        }),
    )
    .add(
        'FioProtocol',
        withPropsCombinations(Badge, {
            size: SIZES,
            type: ['fioprotocol'],
        }),
    )
    .add(
        'Contacts',
        withPropsCombinations(Badge, {
            size: SIZES,
            type: ['contacts'],
        }),
    )
    .add(
        'Accounts',
        withPropsCombinations(Badge, {
            size: SIZES,
            type: ['accounts'],
        }),
    )
    .add(
        'Success',
        withPropsCombinations(Badge, {
            size: SIZES,
            type: ['success'],
        }),
    )
    .add(
        'Open',
        withPropsCombinations(Badge, {
            size: SIZES,
            type: ['open'],
        }),
    )
    .add(
        'Planned',
        withPropsCombinations(Badge, {
            size: SIZES,
            type: ['planned'],
        }),
    );
