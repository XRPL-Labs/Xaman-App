import StyleService from '@services/StyleService';

/* Styles ==================================================================== */
export default StyleService.create({
    loadingContainer: {
        borderRadius: 15,
        backgroundColor: '$tint',
        paddingHorizontal: 17,
        paddingVertical: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    collapseButton: {
        backgroundColor: '$black',
        borderRadius: 8,
        height: 25,
        width: 40,
        justifyContent: 'center',
        alignSelf: 'center',
        // marginTop: 5,
    },
    collapseIcon: {
        alignSelf: 'center',
        tintColor: '$white',
    },
});
