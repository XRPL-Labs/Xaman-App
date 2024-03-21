export interface FeeItem {
    type: string;
    value: string;
}

export interface Props {
    availableFees: FeeItem[];
    selectedFee: FeeItem;
    onSelect: (fee: FeeItem) => void;
}

export interface State {
    selected: FeeItem;
}
