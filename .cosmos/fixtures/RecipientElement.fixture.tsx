import React from 'react';

import { RecipientElement } from '@components/Modules/RecipientElement';

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
    Original: <RecipientElement recipient={{ ...RECIPIENT_DATA }} onPress={onPressMock} />,
    WithSource: (
        <RecipientElement recipient={{ ...RECIPIENT_DATA, source: 'internal:bithomp.com' }} onPress={onPressMock} />
    ),
    Selected: (
        <RecipientElement
            recipient={{ ...RECIPIENT_DATA, source: 'internal:bithomp.com' }}
            onPress={onPressMock}
            selected
        />
    ),
};
