import React from 'react';
import { View } from 'react-native';

const WebView = React.forwardRef((props: Record<string, unknown>, ref) =>
    React.createElement(View, { ...props, ref, testID: (props.testID as string) || 'webview' }),
);

WebView.displayName = 'WebView';

export default WebView;
export { WebView };
