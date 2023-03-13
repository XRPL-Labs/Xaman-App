import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface Styles {
    container: ViewStyle;
    errorText: TextStyle;
    errorTextTitle: TextStyle;
    loadingOrErrorView: ViewStyle;
    webView: ViewStyle;
    loadingProgressBar: ViewStyle;
}

const styles = StyleSheet.create<Styles>({
    container: {
        flex: 1,
        overflow: 'hidden',
    },
    // eslint-disable-next-line react-native/no-color-literals
    loadingOrErrorView: {
        position: 'absolute',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        width: '100%',
        backgroundColor: 'white',
    },
    loadingProgressBar: {
        height: 20,
    },
    errorText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 2,
    },
    errorTextTitle: {
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 10,
    },
    // eslint-disable-next-line react-native/no-color-literals
    webView: {
        backgroundColor: '#ffffff',
    },
});

export default styles;
