/* eslint-disable react-native/no-color-literals */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable implicit-arrow-linebreak */

import React from 'react';
import { View } from 'react-native';

import Locale from '@locale';

const withContainer = (storyFn: any) => {
    Locale.setLocale('en');
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
            {storyFn()}
        </View>
    );
};

export { withContainer };
