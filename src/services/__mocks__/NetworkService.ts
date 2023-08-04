/* eslint-disable class-methods-use-this */
/* eslint-disable spellcheck/spell-checker */

class NetworkService {
    public getNativeAsset() {
        return 'XRP';
    }

    public getNetworkId() {
        return 0;
    }

    public getNetworkReserve() {
        return {
            BaseReserve: 10,
            OwnerReserve: 2,
        };
    }
}

export default new NetworkService();
