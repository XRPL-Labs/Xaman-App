import StyleService from '@services/StyleService';

import { AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    separatorContainer: {
        width: '100%',
        backgroundColor: '$tint',
        paddingHorizontal: AppSizes.paddingSml,
        paddingVertical: AppSizes.paddingExtraSml,
        marginVertical: AppSizes.paddingSml,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
    },
    checkIcon: {
        tintColor: '$contrast',
        marginRight: AppSizes.paddingSml,
    },
    xIcon: {
        tintColor: '$red',
        marginRight: AppSizes.paddingSml,
    },
    revokeAccessButton: {
        backgroundColor: '$red',
        marginVertical: AppSizes.padding,
        marginHorizontal: AppSizes.paddingSml,
    },
});

export default styles;
