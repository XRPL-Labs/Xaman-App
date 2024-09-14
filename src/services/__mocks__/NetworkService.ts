/* eslint-disable class-methods-use-this */

class NetworkService {
    public network = {
        baseReserve: 10,
        ownerReserve: 2,
        isFeatureEnabled: jest.fn(),
        definitions: {},
        nativeAsset: {
            asset: 'XRP',
            icon: 'icon_uri',
            iconSquare: 'icon_square_uri',
        },
    };

    static ORIGIN = '/xaman/0.0.01/ios';
    private userId = 'MOCK_USER_ID';

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

    public getNetwork(): any {
        return this.network;
    }
}

export default new NetworkService();
