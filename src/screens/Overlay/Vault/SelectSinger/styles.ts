/* eslint-disable react-native/no-color-literals */

import StyleService from '@services/StyleService';

import { AppSizes, AppStyles } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        ...AppStyles.paddingSml,
    },
    signButton: {
        marginTop: AppSizes.paddingSml,
        width: '80%',
    },
});

export default styles;
