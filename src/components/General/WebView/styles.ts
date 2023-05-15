import { StyleSheet, ViewStyle } from 'react-native';

interface Styles {
    container: ViewStyle;
    webView: ViewStyle;
}

const styles = StyleSheet.create<Styles>({
    container: {
        flex: 1,
        overflow: 'hidden',
    },
    // eslint-disable-next-line react-native/no-color-literals
    webView: {
        backgroundColor: '#ffffff',
    },
});

export default styles;
