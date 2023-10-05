import { Platform } from 'react-native';

import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    headerContainer: {
        flexDirection: 'row',
        backgroundColor: '$background',
        height:
            AppSizes.heightPercentageToDP(6) +
            Platform.select({ ios: AppSizes.statusBarHeight, default: AppSizes.paddingExtraSml }),
        paddingTop: Platform.select({ ios: AppSizes.statusBarHeight, default: AppSizes.paddingExtraSml }),
        paddingBottom: 5,
        zIndex: 2,
        borderBottomColor: '$tint',
        borderBottomWidth: 1,
    },
    headerLeftContainer: {
        flex: 1,
        flexDirection: 'row',
        paddingLeft: AppSizes.paddingExtraSml,
        paddingRight: AppSizes.paddingSml,
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    headerRightContainer: {
        flex: 1,
        flexDirection: 'row',
        paddingRight: AppSizes.paddingExtraSml,
        justifyContent: 'flex-end',
    },
    headerExpandedContainer: {
        paddingLeft: AppSizes.paddingExtraSml,
        paddingRight: AppSizes.paddingExtraSml,
        backgroundColor: '$background',
        borderBottomColor: '$tint',
        borderBottomWidth: 1,
    },
    expandableButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleText: {
        color: '$textPrimary',
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size,
        marginLeft: AppSizes.paddingExtraSml,
    },
    headerButtonClose: {
        marginLeft: AppSizes.paddingExtraSml,
    },
    headerButton: {
        borderRadius: 10,
    },
    headerButtonText: {
        color: '$textPrimary',
        textAlign: 'center',
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.h5.size,
        paddingLeft: AppSizes.paddingExtraSml,
    },
    iconChevronDown: {
        tintColor: '$contrast',
    },

    accountSwitchContainer: {
        marginBottom: AppSizes.paddingExtraSml,
    },
});

export default styles;
