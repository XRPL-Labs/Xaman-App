import { Platform } from 'react-native';

import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';

import { HasBottomNotch, HasTopNotch } from '@common/helpers/device';
/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        flex: 1,
        backgroundColor: '$lightGrey',
    },
    transactionContent: {
        flex: 1,
        backgroundColor: '$background',
        borderTopRightRadius: 30,
        borderTopLeftRadius: 30,
        paddingVertical: AppSizes.padding,
    },
    rowLabel: {
        marginLeft: 5,
        marginBottom: 5,
    },
    xamanAppBackground: {
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
    headerContainer: {
        backgroundColor: '$background',
        alignItems: 'center',
        paddingTop: HasTopNotch() ? 50 : Platform.OS === 'android' ? 10 : 30,
        paddingHorizontal: AppSizes.paddingSml,
        paddingBottom: 10,
    },
    acceptButtonContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingTop: AppSizes.paddingSml,
        paddingBottom: HasBottomNotch() ? 20 : 0,
    },
    keyboardAvoidContainerStyle: {
        flexGrow: 1,
    },
});

export default styles;
