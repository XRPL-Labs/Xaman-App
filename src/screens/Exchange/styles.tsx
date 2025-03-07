import { Platform } from 'react-native';
import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';
/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        flex: 1,
        flexDirection: 'column',
    },
    contentContainer: {
        flex: 1,
        backgroundColor: '$background',
    },
    fromContainer: {
        backgroundColor: '$background',
        paddingTop: AppSizes.paddingSml,
        padding: AppSizes.padding,
        paddingBottom: 20,
    },
    toContainer: {
        paddingTop: 30,
        padding: AppSizes.padding,
        paddingBottom: AppSizes.paddingSml,
    },
    bottomContainer: {
        paddingHorizontal: AppSizes.padding,
    },
    currencyLabel: {
        fontSize: AppFonts.h5.size,
        fontFamily: AppFonts.base.familyMonoBold,
        color: '$textPrimary',
    },
    currencyImageContainer: {
        marginRight: 10,
    },
    subLabel: {
        fontSize: AppFonts.subtext.size,
        fontFamily: AppFonts.base.familyMono,
        color: '$textSecondary',
        paddingTop: 5,
    },
    issuerLabelSmall: {
        fontSize: AppFonts.small.size,
        fontFamily: AppFonts.base.family,
        color: '$textSecondary',
        paddingTop: 5,
    },
    detailsLabel: {
        fontSize: AppFonts.subtext.size * 0.9,
        fontFamily: AppFonts.base.family,
        // color: StyleService.isDarkMode() ? '$light' : '$darkGrey',
        color: StyleService.select({ dark: '$silver', light: '$grey' }),
    },
    detailsValue: {
        fontSize: AppFonts.subtext.size * 0.9,
        fontFamily: AppFonts.base.familyMonoBold,
        // color: StyleService.isDarkMode() ? '$light' : '$darkGrey',
        color: StyleService.select({ dark: '$light', light: '$blue' }),
    },
    inputContainer: {
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
        paddingHorizontal: 20,
        marginLeft: 0,
        backgroundColor: '$tint',
        borderRadius: 15,
        borderColor: '$tint',
        borderWidth: 2,
    },
    fromAmount: {
        padding: 0,
        margin: 0,
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.h3.size,
        color: '$red',
        paddingVertical: Platform.OS === 'ios' ? 17 : 12,
    },
    toAmount: {
        padding: 0,
        margin: 0,
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.h3.size,
        color: '$green',
        paddingVertical: 17,
    },
    switchButton: {
        zIndex: 2,
    },
    backgroundImageStyle: {
        height: AppSizes.scale(200),
        width: AppSizes.scale(200),
        resizeMode: 'contain',
        tintColor: '$tint',
        opacity: 1,
        transform: [{ rotate: '90deg' }],
    },
    loaderStyle: {
        alignSelf: 'center',
        width: AppSizes.scale(130),
        resizeMode: 'contain',
    },
    allButton: {
        backgroundColor: '$lightBlue',
    },
    separatorLine: {
        top: '50%',
    },
    detailsContainer: {
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 2,
        backgroundColor: '$tint',
        borderRadius: 15,
        borderColor: '$tint',
        borderWidth: 2,
    },
    detailsRow: {
        left: 0,
        right: 0,
        flexDirection: 'row',
        paddingBottom: 10,
    },
});

export default styles;
