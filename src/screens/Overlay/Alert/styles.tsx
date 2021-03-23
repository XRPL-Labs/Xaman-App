/* eslint-disable react-native/no-color-literals */

import StyleService from '@services/StyleService';

import { AppStyles, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    visibleContent: {
        width: AppSizes.screen.width * 0.9,
        backgroundColor: '$background',
        borderRadius: AppSizes.screen.width * 0.07,
        shadowColor: '$light',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 1,
        shadowOpacity: 0.4,
        ...AppStyles.paddingSml,
    },

    iconError: {
        tintColor: '$red',
    },
    iconWarning: {
        tintColor: '$orange',
    },
    iconInfo: {
        tintColor: '$blue',
    },
    iconSuccess: {
        tintColor: '$green',
    },
    title: {
        ...AppStyles.h5,
    },
    subTitle: {
        ...AppStyles.p,
        textAlign: 'center',
    },
    titleError: {
        color: '$red',
    },
    titleWarning: {
        color: '$orange',
    },
    titleInfo: {
        color: '$blue',
    },
    titleSuccess: {
        color: '$green',
    },
});

export default styles;
