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
        paddingVertical: 17,
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
});

export default styles;
