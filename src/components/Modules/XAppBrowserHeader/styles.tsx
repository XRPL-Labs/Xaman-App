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
        zIndex: 1,
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
        flexDirection: 'row',
        height: AppSizes.heightPercentageToDP(4),
        paddingLeft: AppSizes.paddingExtraSml,
        paddingRight: AppSizes.paddingExtraSml,
        backgroundColor: '$tint',
        zIndex: -99999,
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
    addressText: {
        color: '$textPrimary',
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.small.size,
    },
    networkText: {
        color: '$textPrimary',
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.small.size,
        paddingLeft: AppSizes.paddingExtraSml,
    },
    headerButton: {
        borderRadius: 10,
        marginLeft: AppSizes.paddingExtraSml,
    },
    networkIcon: {
        tintColor: '$green',
    },
    iconChevronDown: {
        tintColor: '$contrast',
    },
});

export default styles;
