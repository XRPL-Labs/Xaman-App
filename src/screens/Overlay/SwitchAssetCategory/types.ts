export enum ASSETS_CATEGORY {
    Tokens = 'Tokens',
    NFTokens = 'NFTokens',
}

export interface Props {
    selected: ASSETS_CATEGORY;
    onSelect: (asset: ASSETS_CATEGORY) => void;
}

export interface State {}
