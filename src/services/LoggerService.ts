/* eslint-disable spellcheck/spell-checker */
/* eslint-disable no-console */
/**
 * Logger Service
 */

/* Types  ==================================================================== */
type levels = 'debug' | 'warn' | 'error';

type methods = {
    debug: { (message: any, data?: any): void };
    warn: { (message: any, data?: any): void };
    error: { (message: any, data?: any): void };
};

/* Service  ==================================================================== */
class LoggerService {
    entries: any[];
    isDEV: boolean;
    MAX_LOG_SIZE: number;
    levels: any;

    constructor() {
        this.entries = [];
        this.MAX_LOG_SIZE = 500;
        this.isDEV = !!__DEV__;
        this.levels = {
            debug: { priority: 20 },
            warn: { priority: 40 },
            error: { priority: 50 },
        };
    }

    pad = (time: string) => time.padStart(2, '0');

    getTimeStamp = () => {
        const date = new Date();
        const hours = this.pad(date.getHours().toString());
        const minutes = this.pad(date.getMinutes().toString());
        const secs = this.pad(date.getSeconds().toString());
        const miliSecs = this.pad(date.getMilliseconds().toString());
        return `${hours}:${minutes}:${secs}.${miliSecs}`;
    };

    createLogger = (namespace: string): methods => {
        const logger = {};

        // eslint-disable-next-line
        const log = (level: levels) => {
            return (message = '', data = '') => {
                if (typeof message !== 'string') {
                    data = message;
                    message = '';
                }

                if (this.isDEV) {
                    const output = `[${namespace}] ${message}`;
                    console[level](output, data);
                }

                // add the log to entries list
                this.addLogMessage(level, message, data);
            };
        };

        for (const current in this.levels) {
            if (Object.prototype.hasOwnProperty.call(this.levels, current)) {
                // @ts-ignore
                logger[current] = log(current);
            }
        }

        // @ts-ignore
        return logger;
    };

    addLogMessage(level: string, message: string, data: any) {
        // push the log to current session
        // TODO: shoulde save in the realm backend with level and data present in the log
        this.entries.push({
            timestamp: this.getTimeStamp(),
            level,
            message,
            data,
        });

        if (this.entries.length > this.MAX_LOG_SIZE) {
            this.entries.shift();
        }
    }

    getLogs() {
        return this.entries;
    }

    clearLogs() {
        this.entries = [];
    }
}

/* Export  ==================================================================== */
export default new LoggerService();
