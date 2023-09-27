import React from 'react';

import { Badge } from '@components/General/Badge';
import withPropsCombinations from '../matrix';

const SIZES = ['small', 'medium', 'large'];

export default {
    Bithomp: withPropsCombinations(Badge, {
        size: SIZES,
        type: ['bithomp'],
    }),

    XRPScan: withPropsCombinations(Badge, {
        size: SIZES,
        type: ['xrpscan'],
    }),

    XRPLNS: withPropsCombinations(Badge, {
        size: SIZES,
        type: ['xrplns'],
    }),

    PayId: withPropsCombinations(Badge, {
        size: SIZES,
        type: ['payid'],
    }),

    Success: withPropsCombinations(Badge, {
        size: SIZES,
        type: ['success'],
    }),
};
