import StyleService from '@services/StyleService';

import { AppSizes } from '@theme';

import { HasBottomNotch } from '@common/helpers/device';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        flex: 1,
        backgroundColor: '$lightGrey',
    },
    accountPickerPadding: {
        paddingHorizontal: 5,
    },
    transactionContent: {
        flex: 1,
        backgroundColor: '$background',
        borderTopRightRadius: 30,
        borderTopLeftRadius: 30,
        paddingVertical: AppSizes.padding,
    },
    shadow: {
        shadowColor: '$contrast',
        shadowOffset: {
            height: 0,
            width: 0,
        },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 30,
        borderRadius: AppSizes.scale(75) / 2.5,
    },
    xamanAppBackground: {
        // resizeMode: 'cover',
        // opacity: 0.65,
        top: '-20%',
    },
    detailsContainer: {
        paddingHorizontal: AppSizes.paddingSml,
        paddingVertical: AppSizes.paddingSml,
    },
    acceptButtonContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingTop: AppSizes.paddingSml,
        paddingHorizontal: AppSizes.paddingSml,
        paddingBottom: HasBottomNotch() ? 20 : 0,
    },
    keyboardAvoidContainerStyle: {
        flexGrow: 1,
    },
});

export default styles;
