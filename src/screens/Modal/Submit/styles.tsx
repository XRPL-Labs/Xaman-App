/* eslint-disable react-native/no-color-literals */

import StyleService from '@services/StyleService';

import { AppSizes, AppColors } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'stretch',
        backgroundColor: '$background',
    },
    logo: {
        width: AppSizes.screen.width * 0.4,
        height: AppSizes.screen.height * 0.1,
        resizeMode: 'contain',
    },
    detailsCard: {
        width: AppSizes.screen.width * 0.85,
        backgroundColor: '$tint',
        borderRadius: AppSizes.screen.width * 0.06,
        shadowColor: '$grey',
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 15,
        shadowOpacity: 0.2,
        padding: 20,
    },
    backgroundImageStyle: {
        height: AppSizes.scale(200),
        width: AppSizes.scale(200),
        resizeMode: 'contain',
        tintColor: AppColors.grey,
        opacity: 0.5,
    },
    containerSuccess: {
        backgroundColor: '$lightGreen',
    },
    containerFailed: {
        backgroundColor: '$lightRed',
    },
    containerQueued: {
        backgroundColor: '$lightBlue',
    },
    successImage: {
        alignSelf: 'center',
        width: AppSizes.scale(250),
        height: AppSizes.scale(250),
        resizeMode: 'contain',
    },
    loaderStyle: {
        alignSelf: 'center',
        width: AppSizes.scale(130),
        resizeMode: 'contain',
    },
});

export default styles;
