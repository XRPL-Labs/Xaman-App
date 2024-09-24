import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    rowContainer: {
        paddingTop: AppSizes.heightPercentageToDP(2.5),
        paddingBottom: AppSizes.heightPercentageToDP(2.5),
    },
    rowLabel: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size,
        color: '$textPrimary',
    },
    rowIcon: {
        tintColor: '$textPrimary',
    },
    hr: {
        borderBottomColor: '$tint',
        borderBottomWidth: 2,
        marginTop: 7,
        marginBottom: 7,
    },

    monetizationContainer: {
        marginHorizontal: AppSizes.paddingSml,
        marginBottom: AppSizes.paddingSml,
    },
});

export default styles;
