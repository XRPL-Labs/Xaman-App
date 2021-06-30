/**
 * placeholder Screen
 */

import React, { Component } from 'react';
import { View } from 'react-native';

// constants
import { AppScreens } from '@common/constants';

/* types ==================================================================== */
export interface Props {}

export interface State {}
/* Component ==================================================================== */
class PlaceholderView extends Component<Props, State> {
    static screenName = AppScreens.Global.Placeholder;

    render() {
        return <View />;
    }
}

/* Export Component ==================================================================== */
export default PlaceholderView;
