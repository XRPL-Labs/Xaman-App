export interface Props {
    address: string;
    tag?: number;
    onClose?: () => void;
}

export interface State {
    participantName?: string;
    contactExist: boolean;
}
