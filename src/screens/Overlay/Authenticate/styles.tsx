/* eslint-disable react-native/no-color-literals */

import StyleService from '@services/StyleService';

import { AppStyles, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    visibleContent: {
        width: AppSizes.screen.width * 0.9,
        backgroundColor: '$background',
        borderColor: '$tint',
        borderWidth: 1,
        borderRadius: 20,
        shadowColor: '$grey',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 5,
        shadowOpacity: 0.4,
        ...AppStyles.paddingSml,
    },
    pinInputPadding: {
        // borderColor: 'purple',
        // borderWidth: 3,
        paddingHorizontal: 15,
        marginTop: 15,
        width: '100%',
    },
});

export default styles;
