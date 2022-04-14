/* eslint-disable spellcheck/spell-checker */
import React from 'react';
import { storiesOf } from '@storybook/react-native';

import { withContainer } from '../../../../storybook/decoration';

import { XAppList } from '../XAppList';

const apps = [
    {
        _type: 'featured',
        icon: 'https://xumm-cdn.imgix.net/app-logo/03ca3259-5f08-446c-a528-d37c478c0e26.png',
        identifier: 'xumm.tangem-backup',
        title: 'Tangem Backup',
    },
    {
        _type: 'featured',
        icon: 'https://xumm-cdn.imgix.net/app-logo/2c6110b9-0806-4396-aa68-73604113257e.png',
        identifier: 'gatehub.trade',
        title: 'GateHub Trade',
    },
    {
        _type: 'featured',
        icon: 'https://xumm-cdn.imgix.net/app-logo/dd9e7154-9d09-4027-babf-e6cee6c9ac6b.png',
        identifier: 'nixer.escrow',
        title: 'Escrow creator',
    },
    {
        _type: 'featured',
        icon: 'https://xumm-cdn.imgix.net/app-logo/7de2eddb-78f2-40dd-88ff-8d365aed52c0.png',
        identifier: 'xumm.push-beta',
        title: 'Pro Push Beta',
    },
];

storiesOf('XAppList', module)
    .addDecorator(withContainer)
    .add('default', () => <XAppList apps={apps} />);
