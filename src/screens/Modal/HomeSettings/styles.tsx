import { StyleSheet, Platform } from 'react-native';

import { IsIPhoneX, getStatusBarHeight } from '@common/helpers/interface';
import { AppColors, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: AppColors.blue },
    topContainer: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? getStatusBarHeight() + 30 : getStatusBarHeight(),
        left: 0,
        right: 0,
    },
    closeIcon: {
        width: AppSizes.screen.width * 0.06,
        height: AppSizes.screen.width * 0.06,
        resizeMode: 'contain',
    },
    iconSettings: {
        tintColor: AppColors.white,
        resizeMode: 'contain',
    },
    // closeButton: {
    //     backgroundColor: AppColors.white,
    //     width: AppSizes.screen.width * 0.3,
    //     height: AppSizes.screen.height * 0.05,
    //     borderRadius: AppSizes.screen.height * 0.5,
    // },
    // closeButtonText: {
    //     color: AppColors.black,
    //     fontSize: AppFonts.base.size * 0.8,
    // },
    // logo: {
    //     width: AppSizes.screen.width * 0.3,
    //     height: AppSizes.screen.height * 0.1,
    //     tintColor: AppColors.white,
    //     resizeMode: 'contain',
    // },
    logo: {
        width: AppSizes.screen.width * 0.35,
        height: AppSizes.screen.height * 0.05,
        resizeMode: 'contain',
        tintColor: AppColors.white,
    },
    separator: {
        borderBottomColor: AppColors.white,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    bottomContainer: {
        position: 'absolute',
        bottom: IsIPhoneX() ? 60 : 40,
        left: 0,
        right: 0,
    },

    whiteText: {
        color: AppColors.white,
    },
});

export default styles;
