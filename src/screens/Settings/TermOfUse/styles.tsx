import StyleService from '@services/StyleService';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        flex: 1,
        backgroundColor: '$background',
    },
    loadingStyle: {
        position: 'absolute',
        backgroundColor: '$background',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default styles;
