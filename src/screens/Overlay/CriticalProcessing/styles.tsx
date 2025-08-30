/* eslint-disable react-native/no-color-literals */

import StyleService from '@services/StyleService';

import { AppStyles, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    visibleContent: {
        // width: AppSizes.screen.width * 0.8,
        width: '100%',
        // backgroundColor: '$contrast',
        borderRadius: AppSizes.screen.width * 0.07,
        shadowColor: '$light',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 1,
        shadowOpacity: 0.4,
        ...AppStyles.paddingSml,
        // borderWidth: 3,
        // borderColor: 'purple',
    },
    blurView: {
        width: AppSizes.screen.width,
        height: AppSizes.screen.height,
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        tintColor: '$orange',
    },
    title: {
        ...AppStyles.h5,
        color: '$contrast',
    },
    title2: {
        ...AppStyles.subtext,
        ...AppStyles.bold,
        textAlign: 'center',
        color: '$contrast',
    },
    subTitle: {
        ...AppStyles.subtext,
        ...AppStyles.bold,
        textAlign: 'center',
        color: '$red',
    },
});

export default styles;
