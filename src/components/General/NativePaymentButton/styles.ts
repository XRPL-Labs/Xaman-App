import StyleService from '@services/StyleService';

const styles = StyleService.create({
    loadingIndicator: {
        position: 'absolute',
        alignSelf: 'center',
        top: '14%',
    },
    payButtonLoading: {
        opacity: 0.5,
    },
    paButtonDisabled: {
        opacity: 0.5,
    },
});

export default styles;
