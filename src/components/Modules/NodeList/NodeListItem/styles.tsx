import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    row: {
        width: AppSizes.screen.width,
        paddingHorizontal: AppSizes.paddingSml,
        paddingBottom: AppSizes.padding,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '$background',
    },
    url: {
        fontSize: AppFonts.subtext.size,
        color: '$textPrimary',
    },
    checkIcon: {
        tintColor: '$blue',
    },
    removeContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
    },
    removeHolder: {
        position: 'absolute',
        top: 0,
        left: AppSizes.screen.width - 125,
        width: AppSizes.screen.width,
        height: AppSizes.screen.width * 0.14,
        paddingLeft: 20,
        backgroundColor: '$red',
        justifyContent: 'center',
    },
});

export default styles;
