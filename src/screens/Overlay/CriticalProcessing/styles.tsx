/* eslint-disable react-native/no-color-literals */

import StyleService from '@services/StyleService';

import { AppStyles, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    visibleContent: {
        width: AppSizes.screen.width * 0.8,
        backgroundColor: '$contrast',
        borderColor: '$tint',
        borderWidth: 1,
        borderRadius: AppSizes.screen.width * 0.07,
        shadowColor: '$light',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 1,
        shadowOpacity: 0.4,
        ...AppStyles.paddingSml,
    },
    blurView: {
        zIndex: 99999,
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        width: AppSizes.screen.width,
        height: AppSizes.screen.height,
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        tintColor: '$silver',
    },
    title: {
        ...AppStyles.h5,
        color: '$tint',
    },
    title2: {
        ...AppStyles.subtext,
        ...AppStyles.bold,
        textAlign: 'center',
        color: '$silver',
    },
    subTitle: {
        ...AppStyles.subtext,
        ...AppStyles.bold,
        textAlign: 'center',
        color: '$red',
    },
});

export default styles;
