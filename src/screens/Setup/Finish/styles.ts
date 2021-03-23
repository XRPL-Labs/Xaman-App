import StyleService from '@services/StyleService';

import { AppSizes, AppStyles } from '@theme';

const styles = StyleService.create({
    container: {
        flex: 1,
        backgroundColor: '$background',
    },
    logo: {
        width: AppSizes.screen.width * 0.4,
        height: AppSizes.screen.height * 0.1,
        resizeMode: 'contain',
    },
    loadingStyle: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    webView: {
        borderRadius: AppStyles.borderRadius.borderRadius,
    },
    contentArea: {
        paddingHorizontal: AppStyles.paddingHorizontalSml.paddingHorizontal,
        borderTopWidth: 2,
        borderBottomWidth: 2,
        borderColor: '$lightBlue',
    },
});

export default styles;
