import { NativeModules } from 'react-native';

const { ClipboardModule } = NativeModules;

const Clipboard = {
    /**
     * Set clipboard string content
     */
    setString(value: string): void {
        ClipboardModule.setString(value);
    },

    /**
     * Get clipboard string content
     */
    getString(): Promise<string> {
        return ClipboardModule.getString();
    },
};

/* Export ==================================================================== */
export { Clipboard };
