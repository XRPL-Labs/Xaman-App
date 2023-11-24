import StyleService from '@services/StyleService';
import { AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        backgroundColor: '$background',
        flex: 1,
    },
    contentContainer: {
        backgroundColor: '$background',
        flex: 1,
        overflow: 'hidden',
    },
    webView: {
        backgroundColor: '$background',
    },
    stateContainer: {
        backgroundColor: '$background',
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: AppSizes.paddingSml,
    },
    infoIcon: {
        tintColor: '$red',
    },
});

export default styles;
