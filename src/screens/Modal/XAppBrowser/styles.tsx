import { Platform } from 'react-native';

import { AppSizes } from '@theme';
import StyleService from '@services/StyleService';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: { 
        flex: 1 
    },
    webViewContainer: {
        position:'fixed',
        flex: 1,
        backgroundColor: '$background',
    },
    loadingStyle: {
        backgroundColor: '$background',
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerContainer: {
        flexDirection: 'row',
        backgroundColor: '$background',
        paddingTop: Platform.OS === 'ios' ? AppSizes.statusBarHeight + 5 : 10,
        paddingBottom: 10,
    },
});

export default styles;
