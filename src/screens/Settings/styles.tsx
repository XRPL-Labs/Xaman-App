import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    rowContainer: {
        paddingTop: AppSizes.heightPercentageToDP(2),
        paddingBottom: AppSizes.heightPercentageToDP(2),
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
        borderBottomColor: '$contrast',
        opacity: 0.15,
        borderBottomWidth: 1,
        marginTop: 7,
        marginBottom: 7,
    },

    monetizationContainer: {
        marginHorizontal: AppSizes.paddingSml,
        marginBottom: AppSizes.paddingSml,
    },
});

export default styles;
