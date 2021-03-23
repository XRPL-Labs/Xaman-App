import StyleService from '@services/StyleService';

import { AppStyles, AppFonts } from '@theme';

/* Styles ==================================================================== */
export default StyleService.create({
    content: {
        // minHeight: AppSizes.screen.height * 0.12,
        width: '100%',
        paddingHorizontal: 20,
        paddingVertical: 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: AppStyles.borderRadius.borderRadius,
    },
    box: {
        height: 23,
        width: 23,
        borderRadius: 5,
        borderWidth: 3,
        borderColor: '$grey',
        // marginTop: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    boxSelected: {
        borderColor: '$blue',
        backgroundColor: '$blue',
    },
    selected: {
        borderColor: '$blue',
        color: '$blue',
    },
    label: {
        fontSize: AppFonts.base.size,
        fontFamily: AppFonts.base.familyExtraBold,
        color: '$grey',
    },
    labelSmall: {
        fontSize: AppFonts.subtext.size,
        fontFamily: AppFonts.base.familyBold,
        color: '$grey',
    },
    labelSelected: {
        color: '$blue',
    },
    descriptionText: {
        color: '$grey',
        marginTop: 3,
    },
    descriptionTextSelected: {
        color: '$blue',
    },
});
