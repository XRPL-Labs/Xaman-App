import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        flex: 1,
        backgroundColor: '$tint',
    },
    contentContainer: {
        flex: 1,
        padding: AppSizes.paddingSml,
        paddingBottom: AppSizes.padding * 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionContainer: {
        backgroundColor: StyleService.select({ light: '$darkGrey', dark: '$black' }),
        borderColor: '$background',
        borderWidth: StyleService.hairlineWidth,
    },
    actionDescription: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size,
        color: '$white',
    },
    infoIcon: {
        tintColor: '$red',
    },
});

export default styles;
