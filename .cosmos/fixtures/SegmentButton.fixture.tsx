import React from 'react';

import { SegmentButton } from '@components/General/SegmentButton';

const BUTTONS = ['All', 'Planned', 'Requests'];

export default (
    <SegmentButton
        buttons={BUTTONS}
        onPress={() => {
            console.log('Pressed');
        }}
    />
);
