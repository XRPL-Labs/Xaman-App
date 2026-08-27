export interface Props {
    testID?: string;
    type: 'success' | 'info' | 'warning' | 'error';
    text: string | React.ReactNode;
    title?: string;
    buttons: { text: string; testID?: string; onPress?: () => void; type?: 'continue' | 'dismiss'; light?: boolean }[];
    onDismissed?: () => void;
}

export interface State {}
