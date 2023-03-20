import StyleService from '@services/StyleService';

/* Styles ==================================================================== */
export default StyleService.create({
    container: {},
    listEmptyContainer: {
        flex: 1,
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    hr: {
        borderBottomColor: '$tint',
        borderBottomWidth: 2,
    },
});
