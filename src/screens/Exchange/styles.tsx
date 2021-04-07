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
        padding: AppSizes.padding,
        paddingBottom: 40,
    },
    toContainer: {
        paddingTop: 50,
        padding: AppSizes.padding,
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
        height: AppSizes.scale(38),
        width: AppSizes.scale(38),
        marginRight: 10,
        borderWidth: 1,
        borderRadius: 8,
        justifyContent: 'center',
        overflow: 'hidden',
        alignSelf: 'center',
        alignItems: 'center',
    },
    xrpImageContainer: {
        padding: 10,
        backgroundColor: '$white',
        borderColor: '$grey',
    },
    iouImageContainer: {
        borderColor: '$light',
    },
    currencyImage: {
        width: AppSizes.scale(37),
        height: AppSizes.scale(37),
        resizeMode: 'cover',
    },
    subLabel: {
        fontSize: AppFonts.subtext.size,
        fontFamily: AppFonts.base.familyMono,
        color: '$grey',
    },

    inputContainer: {
        left: 0,
        right: 0,
        flexDirection: 'row',
        backgroundColor: '$tint',
        borderRadius: 10,
        borderColor: '$tint',
        borderWidth: 2,
        paddingHorizontal: 15,
        paddingVertical: 15,
    },
    fromAmount: {
        textAlign: 'right',
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.h3.size,
        fontWeight: '600',
        color: '$red',
        overflow: 'hidden',
        padding: 0,
        margin: 0,
    },
    toAmount: {
        textAlign: 'right',
        fontFamily: AppFonts.base.familyMonoBold,
        fontWeight: '600',
        fontSize: AppFonts.h3.size,
        color: '$green',
        padding: 0,
        margin: 0,
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
});

export default styles;
