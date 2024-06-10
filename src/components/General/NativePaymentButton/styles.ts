import StyleService from '@services/StyleService';

const styles = StyleService.create({
    loadingIndicator: {
        position: 'absolute',
        alignSelf: 'center',
        top: '7%',
    },
    payButtonLoading: {
        opacity: 0.5,
    },
});

export default styles;
