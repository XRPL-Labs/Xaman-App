import { Platform } from 'react-native';

import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';

import { hasNotch } from '@common/helpers/device';
/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        flex: 1,
        backgroundColor: '$lightGrey',
    },
    transactionContent: {
        backgroundColor: '$background',
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
        color: '$textPrimary',
    },
    descriptionLabel: {
        fontSize: AppFonts.small.size,
        fontFamily: AppFonts.subtext.family,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 3,
        color: '$textPrimary',
    },
    instructionText: {
        fontSize: AppFonts.subtext.size,
        fontFamily: AppFonts.subtext.family,
        textAlign: 'center',
        marginBottom: 15,
        paddingHorizontal: 10,
        color: '$textPrimary',
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
        backgroundColor: '$background',
        alignItems: 'center',
        paddingTop: hasNotch() ? 50 : Platform.OS === 'android' ? 10 : 30,
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
