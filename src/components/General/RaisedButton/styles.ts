import { StyleSheet } from 'react-native';

import { AppColors, AppFonts, AppSizes } from '@theme';

const BUTTON_HEIGHT = AppSizes.scale(50);

export const styles = StyleSheet.create({
    container: {
        height: BUTTON_HEIGHT,
        width: '100%',
        backgroundColor: AppColors.transparent,
        zIndex: 10,
        shadowColor: AppColors.blue,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 3,
    },
    container__text: {
        fontWeight: 'bold',
        zIndex: 10,
        textAlign: 'center',
    },
    container__view: {
        flexDirection: 'row',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    container__placeholder: {
        width: '55%',
    },
    container__activity: {
        position: 'absolute',
        zIndex: 5,
    },
    bottom: {
        width: '100%',
        height: BUTTON_HEIGHT,
        borderRadius: 13,
        backgroundColor: AppColors.white,
        position: 'absolute',
        bottom: 0,
        left: 0,
    },
    content: {
        width: '100%',
        height: BUTTON_HEIGHT,
        position: 'absolute',
        top: 0,
        left: 0,
    },
    children: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3,
        overflow: 'hidden',
    },
    buttonWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconLeft: {
        marginRight: 3,
    },
    iconRight: {
        marginLeft: 3,
    },
    textButton: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size * 1.1,
        textAlign: 'center',
        color: AppColors.black,
        paddingHorizontal: 5,
    },
});
