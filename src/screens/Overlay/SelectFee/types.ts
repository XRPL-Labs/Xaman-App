export interface FeeItem {
    type: string;
    value: string;
    note?: string;
}

export interface Props {
    availableFees: FeeItem[];
    selectedFee: FeeItem;
    serviceFee: FeeItem;
    onSelect: (txFee: FeeItem, serviceFee?: FeeItem) => void;
}

export interface State {
    selectedFee: FeeItem;
}
