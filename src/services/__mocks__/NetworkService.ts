/* eslint-disable class-methods-use-this */
/* eslint-disable spellcheck/spell-checker */

class NetworkService {
    public network = {
        baseReserve: 10,
        ownerReserve: 2,
        isFeatureEnabled: () => {},
        definitions: {},
        nativeAsset: {
            asset: 'XRP',
            icon: 'icon_uri',
            iconSquare: 'icon_square_uri',
        },
    };

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

    public getNetworkDefinitions(): any {
        return undefined;
    }
}

export default new NetworkService();
