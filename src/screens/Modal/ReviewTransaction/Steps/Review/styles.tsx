import { StyleSheet, Platform } from 'react-native';

import { AppSizes, AppFonts, AppColors } from '@theme';

import { IsIPhoneX } from '@common/helpers/device';
/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.light,
    },
    transactionContent: {
        backgroundColor: AppColors.white,
        borderRadius: 30,
        paddingTop: 28,
    },
    rowLabel: {
        marginLeft: 5,
        marginBottom: 5,
    },
    xummAppBackground: {
        resizeMode: 'cover',
        opacity: 0.03,
    },
    appTitle: {
        fontSize: AppFonts.pb.size,
        fontFamily: AppFonts.pb.family,
        marginTop: 15,
        marginBottom: 15,
    },
    descriptionLabel: {
        fontSize: AppFonts.small.size,
        fontFamily: AppFonts.subtext.family,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 3,
    },
    instructionText: {
        fontSize: AppFonts.subtext.size,
        fontFamily: AppFonts.subtext.family,
        textAlign: 'center',
        marginBottom: 15,
        paddingHorizontal: 10,
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
        backgroundColor: 'rgba(255,255,255,0.95)',
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
    },
    headerContainer: {
        backgroundColor: AppColors.white,
        alignItems: 'center',
        paddingTop: IsIPhoneX() ? 50 : Platform.OS === 'android' ? 10 : 30,
        paddingHorizontal: AppSizes.paddingSml,
        paddingBottom: 10,
    },
    topContent: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyboardAvoidViewStyle: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
    },
});

export default styles;
