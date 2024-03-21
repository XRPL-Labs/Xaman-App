export interface Props {
    address: string;
    tag?: number;
    onClose?: () => void;
}

export interface State {
    recipientName?: string;
    contactExist: boolean;
}
