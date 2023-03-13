import StyleService from '@services/StyleService';

/* Styles ==================================================================== */
export default StyleService.create({
    emptyContainer: {
        borderRadius: 15,
        backgroundColor: '$tint',
        paddingHorizontal: 17,
        paddingVertical: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    loadingIndicator: {
        paddingRight: 10,
    },
    triangleIconContainer: {
        marginRight: 10,
    },
    newPaymentOptionsButton: {
        marginTop: 35,
    },
});
