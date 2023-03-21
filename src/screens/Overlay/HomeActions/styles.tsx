import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    rowTitle: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size,
        paddingVertical: AppSizes.paddingSml,
        paddingHorizontal: AppSizes.paddingExtraSml,
    },
    rowTitleFirst: {
        paddingTop: 0,
    },
    actionButtonContainer: {
        flexDirection: 'row',
        paddingTop: AppSizes.padding,
    },
});

export default styles;
