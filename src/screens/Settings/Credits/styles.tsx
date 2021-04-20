import StyleService from '@services/StyleService';

/* Styles ==================================================================== */
const styles = StyleService.create({
    loadingStyle: {
        backgroundColor: '$background',
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default styles;
