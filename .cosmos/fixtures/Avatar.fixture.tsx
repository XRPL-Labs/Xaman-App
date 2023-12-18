import React from 'react';
import { Avatar } from '@components/General/Avatar';

const URI = { uri: 'https://xumm.app/_nuxt/team-peter.de2cdd6b.png' };

export default {
    Original: <Avatar source={URI} />,
    'With Border': <Avatar source={URI} border />,
    Big: <Avatar source={URI} size={100} />,
    'With Badge': <Avatar source={URI} size={100} badge="IconCheckXaman" />,
    'With Badge Color': <Avatar source={URI} size={100} badge="IconAlertTriangle" badgeColor="red" />,
};
