import StyleService from '@services/StyleService';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        flex: 1,
        backgroundColor: '$background',
    },
    infoMessage: {
        backgroundColor: StyleService.select({ light: '$light', dark: '$darkGrey' }),
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: StyleService.select({ light: '$lightBlue', dark: '$lightGrey' }),
    },
});

export default styles;
