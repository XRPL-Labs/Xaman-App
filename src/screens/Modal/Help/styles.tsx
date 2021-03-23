import StyleService from '@services/StyleService';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', alignSelf: 'stretch' },
    backgroundImageStyle: {
        resizeMode: 'contain',
        tintColor: '$tint',
        opacity: 1,
    },
});

export default styles;
