import { StyleSheet } from 'react-native';

import { AppColors, AppSizes } from '@theme';
/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    visibleContent: {
        height: AppSizes.screen.height * 0.8,
        width: AppSizes.screen.width * 0.9,
        backgroundColor: AppColors.white,
        borderRadius: 20,
    },
    headerContainer: {
        backgroundColor: AppColors.white,
        borderTopRightRadius: 20,
        borderTopLeftRadius: 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        padding: AppSizes.paddingSml,
        shadowColor: AppColors.blue,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 3,
        shadowOpacity: 0.1,
    },
    contentContainer: {
        paddingVertical: AppSizes.paddingSml,
        paddingTop: 10,
    },
    loadingStyle: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default styles;
