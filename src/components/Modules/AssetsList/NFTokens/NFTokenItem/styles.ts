import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        paddingHorizontal: AppSizes.paddingList,
    },
    tokenImageContainer: {
        marginRight: 10,
    },
    label: {
        flexWrap: 'wrap',
        flexShrink: 1,
        fontSize: AppFonts.subtext.size,
        fontFamily: AppFonts.base.familyBold,
        color: '$textPrimary',
        marginBottom: 3,
    },
    labelPlaceholder: {
        color: StyleService.isDarkMode() ? '$grey' : '$silver',
        backgroundColor: StyleService.isDarkMode() ? '$grey' : '$silver',
    },
    description: {
        flexWrap: 'wrap',
        flexShrink: 1,
        fontFamily: AppFonts.base.familyMono,
        fontSize: AppFonts.small.size,
        color: '$silver',
    },
    descriptionPlaceholder: {
        color: StyleService.isDarkMode() ? '$grey' : '$silver',
        backgroundColor: StyleService.isDarkMode() ? '$grey' : '$silver',
    },
    iconExternalLink: {
        tintColor: '$grey',
        marginRight: 5,
    },
});
