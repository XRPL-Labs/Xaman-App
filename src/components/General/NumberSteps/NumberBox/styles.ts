import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';

const styles = StyleService.create({
    box: {
        height: AppSizes.widthPercentageToDP(8),
        width: AppSizes.widthPercentageToDP(8),
        borderRadius: 10,
        backgroundColor: '$tint',
        borderColor: '$silver',
        justifyContent: 'center',
        alignItems: 'center',
    },
    boxActive: {
        height: AppSizes.widthPercentageToDP(10),
        width: AppSizes.widthPercentageToDP(10),
        borderRadius: 8,
        borderWidth: 3,
        borderColor: '$blue',
        backgroundColor: '$blue',
    },
    boxPast: {
        backgroundColor: '$blue',
    },
    label: {
        fontFamily: AppFonts.base.familyExtraBold,
        fontSize: AppFonts.base.size,
        color: '$textPrimary',
        textAlign: 'center',
    },
    labelActive: {
        fontSize: AppFonts.h5.size,
        color: '$white',
    },
    labelPast: {
        color: '$white',
    },
});

export default styles;
