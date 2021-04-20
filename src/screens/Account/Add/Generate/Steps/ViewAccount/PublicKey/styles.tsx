import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    labelWrapper: {
        backgroundColor: '$lightBlue',
        justifyContent: 'center',
        paddingHorizontal: 5,
        height: AppSizes.heightPercentageToDP(9),
        borderRadius: AppSizes.heightPercentageToDP(2),
        marginBottom: 40,
    },
    addressHeader: {
        fontSize: AppFonts.base.size,
        color: '$blue',
        textAlign: 'center',
        paddingBottom: 10,
    },
    addressField: {
        color: '$blue',
        fontSize: AppFonts.base.size,
        fontFamily: AppFonts.base.familyMonoBold,
        textAlign: 'center',
    },
    bigIcon: {
        width: 80,
        height: 80,
    },
});

export default styles;
