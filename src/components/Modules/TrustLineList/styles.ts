import StyleService from '@services/StyleService';

/* Styles ==================================================================== */
export default StyleService.create({
    noTrustlineMessage: {
        marginTop: 10,
    },
    trustLineInfoIcon: {
        tintColor: '$grey',
        marginRight: 5,
    },
    headerContainer: {
        marginLeft: -15,
        marginRight: -15,
        marginBottom: 5,
        paddingHorizontal: 15,
        paddingBottom: 5,
        backgroundColor: '$background',
        shadowColor: '$background',
        shadowOffset: { width: 0, height: 12 },
        shadowRadius: 5,
        shadowOpacity: 1,
        zIndex: 1,
    },
});
