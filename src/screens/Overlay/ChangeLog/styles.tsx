import StyleService from '@services/StyleService';

import { AppSizes } from '@theme';
/* Styles ==================================================================== */
const styles = StyleService.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    visibleContent: {
        height: AppSizes.screen.height * 0.8,
        width: AppSizes.screen.width * 0.9,
        backgroundColor: '$background',
        borderRadius: 22,
        borderColor: '$tint',
        borderWidth: 1,
    },
    headerContainer: {
        backgroundColor: '$tint',
        borderTopRightRadius: 20,
        borderTopLeftRadius: 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        padding: AppSizes.paddingSml,
        shadowColor: '$blue',
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 3,
        shadowOpacity: 0.1,
    },
    contentContainer: {
        paddingVertical: AppSizes.paddingSml,
        paddingTop: 10,
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
});

export default styles;
