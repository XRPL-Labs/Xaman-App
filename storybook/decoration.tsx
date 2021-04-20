/* eslint-disable react-native/no-color-literals */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable implicit-arrow-linebreak */

import React from 'react';
import { View } from 'react-native';

import Locale from '../src/locale';

const withBackground = (storyFn: any) => (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#F0F3FF' }}>{storyFn()}</View>
);

const withLocale = (storyFn: any) => {
    Locale.setLocale('en');
    return storyFn();
};

export { withBackground, withLocale };
