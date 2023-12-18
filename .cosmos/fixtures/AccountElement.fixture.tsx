import React from 'react';

import { AccountElement } from '@components/Modules/AccountElement';

const RECIPIENT_DATA = {
    id: 'id',
    address: 'rwiETSee2wMz3SBnAG8hkMsCgvGy9LWbZ1',
    name: 'Wietse',
    source: 'contacts',
};

const onPressMock = () => {
    console.log('RecipientElement onPress');
};

export default {
    Original: <AccountElement address={RECIPIENT_DATA.address} info={RECIPIENT_DATA} onPress={onPressMock} />,
    WithSource: (
        <AccountElement
            address={RECIPIENT_DATA.address}
            info={{ ...RECIPIENT_DATA, source: 'internal:bithomp.com' }}
            onPress={onPressMock}
        />
    ),
};
