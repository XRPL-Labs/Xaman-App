import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

const styles = StyleService.create({
    container: {
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    box: {
        height: AppSizes.widthPercentageToDP(8),
        width: AppSizes.widthPercentageToDP(8),
        borderRadius: 10,
        backgroundColor: '$grey',
        borderColor: '$grey',
        justifyContent: 'center',
        alignItems: 'center',
    },
    boxActive: {
        height: AppSizes.widthPercentageToDP(10),
        width: AppSizes.widthPercentageToDP(10),
        borderRadius: 8,
        borderWidth: 3,
        borderColor: '$blue',
        backgroundColor: '$lightBlue',
    },
    label: {
        fontFamily: AppFonts.base.familyExtraBold,
        fontSize: AppFonts.base.size,
        color: '$textPrimary',
        textAlign: 'center',
    },
    labelActive: {
        fontSize: AppFonts.h5.size,
        color: '$blue',
    },
    line: {
        borderBottomColor: '$tint',
        borderBottomWidth: 4,
        width: AppSizes.widthPercentageToDP(6),
    },
});

export default styles;
