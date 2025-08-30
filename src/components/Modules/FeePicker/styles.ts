import StyleService from '@services/StyleService';

/* Styles ==================================================================== */
export default StyleService.create({
    outerContainer: {
        // borderWidth: 2,
        // borderColor: '#ffcc00',
        minHeight: 45,
    },
    loaderText: {
        marginLeft: 29,
        top: 4,
    },
    loaderContainer: {
    },
    loader: {
        position: 'absolute',
        top: 2,
    },
    container: {
        flexDirection: 'row',
    },
    editButton: {
        backgroundColor: '$tint',
        borderRadius: 8,
        height: 25,
        width: 40,
        justifyContent: 'center',
        alignSelf: 'center',
        // marginRight: 15,
    },
    badgeLabel: {
        color: '$textContrast',
    },
});
