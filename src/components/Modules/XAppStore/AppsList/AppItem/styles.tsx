import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        height: AppSizes.heightPercentageToDP(7.5),
    },
    appTitle: {
        fontSize: AppFonts.subtext.size,
        fontFamily: AppFonts.base.familyBold,
        color: '$textPrimary',
    },
    appTitlePlaceholder: {
        color: '$light',
        backgroundColor: '$light',
    },
    appIcon: {
        width: '80%',
        aspectRatio: 1,
        borderRadius: 10,
    },
    appIconPlaceholder: {
        backgroundColor: '$silver',
    },
    titleContainer: {
        flex: 1,
        marginTop: 5,
        marginLeft: AppSizes.paddingExtraSml,
    },
    rightPanelContainer: {
        alignItems: 'flex-end',
    },
    categoryContainer: {
        backgroundColor: '$tint',
        paddingHorizontal: 3,
        paddingVertical: 1,
        borderRadius: 5,
        alignSelf: 'flex-start',
    },
    categoryLabel: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.small.size * 0.9,
        color: '$textPrimary',
    },
});

export default styles;
