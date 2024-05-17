export enum ASSETS_CATEGORY {
    Tokens = 'Tokens',
    NFTs = 'NFTs',
}

export interface Props {
    selected: ASSETS_CATEGORY;
    onSelect: (asset: ASSETS_CATEGORY) => void;
}

export interface State {}
