import { StyleSheet, Platform } from 'react-native';

import { AppFonts, AppColors, AppSizes } from '@theme';

import { IsIPhoneX } from '@common/helpers';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.light,
    },
    headerContainer: {
        backgroundColor: AppColors.white,
        alignItems: 'center',
        paddingTop: IsIPhoneX() ? 50 : Platform.OS === 'android' ? 10 : 30,
        paddingHorizontal: AppSizes.paddingSml,
        paddingBottom: 10,
        // backgroundColor: AppColors.white,
        // borderBottomLeftRadius: 30,
        // borderBottomRightRadius: 30,
    },
    scrollPart: {
        width: '100%',
        padding: 0,
        margin: 0,
    },
    collapsingHeader: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    xummAppBackground: {
        resizeMode: 'cover',
        opacity: 0.03,
    },
    xummAppTitle: {
        fontSize: AppFonts.pb.size,
        fontFamily: AppFonts.pb.family,
        marginBottom: 15,
    },
    xummAppIcon: {
        width: 60,
        height: 60,
        borderRadius: 15,
        backgroundColor: AppColors.white,
        borderColor: AppColors.greyDark,
        borderWidth: StyleSheet.hairlineWidth,
        marginBottom: 10,
        marginTop: 10,
    },
    xummAppLabelText: {
        fontSize: AppFonts.small.size,
        fontFamily: AppFonts.subtext.family,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 3,
    },
    xummAppLabelInfo: {
        fontSize: AppFonts.subtext.size,
        fontFamily: AppFonts.subtext.family,
        textAlign: 'center',
        marginBottom: 15,
        paddingHorizontal: 10,
    },
    transactionContent: {
        backgroundColor: AppColors.white,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 28,
    },
    // DeclineText: {
    //     color: AppColors.red,
    // },
    // payloadTypeText: {
    //     color: AppColors.blue,
    // },
    // gradientImage: {
    //     width: 7,
    //     position: 'absolute',
    //     left: 0,
    //     top: 0,
    // },
    rowLabel: {
        marginLeft: 5,
        marginBottom: 5,
    },
    // rowItem: {
    //     paddingHorizontal: AppSizes.paddingSml,
    //     paddingVertical: AppSizes.paddingSml,
    //     borderTopColor: AppColors.grey,
    //     borderTopWidth: 1,
    // },
    pickerItem: {
        // paddingLeft: 10,
        // paddingTop: 10,
        // paddingBottom: 10,
        // justifyContent: 'space-between',
        // marginBottom: 5,
        // borderWidth: 1,
        // borderColor: AppColors.red,
    },
    detailsCard: {
        width: AppSizes.screen.width * 0.85,
        backgroundColor: AppColors.white,
        borderRadius: AppSizes.screen.width * 0.06,
        shadowColor: AppColors.greyDark,
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 15,
        shadowOpacity: 0.2,
        padding: 20,
    },
    // eslint-disable-next-line
    blurView: {
        zIndex: 99999,
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        width: AppSizes.screen.width,
        height: AppSizes.screen.height,
        backgroundColor: Platform.OS === 'android' ? 'rgba(255,255,255,0.9)' : AppColors.transparent,
    },
    absolute: {
        zIndex: 999999,
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        width: AppSizes.screen.width,
        height: AppSizes.screen.height,
        // padding: AppSizes.paddingSml,
        // justifyContent: 'center',
        // alignItems: 'center',
    },
    backgroundImageStyle: {
        height: AppSizes.scale(200),
        width: AppSizes.scale(200),
        resizeMode: 'contain',
        tintColor: AppColors.grey,
        opacity: 0.5,
    },
    loaderStyle: {
        alignSelf: 'center',
        width: AppSizes.scale(130),
        resizeMode: 'contain',
    },
});

export default styles;
