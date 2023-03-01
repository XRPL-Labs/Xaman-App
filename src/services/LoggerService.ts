/* eslint-disable spellcheck/spell-checker */
/* eslint-disable no-console */
/**
 * Logger Service
 */

import { ErrorMessages } from '@common/constants';

import crashlytics from '@react-native-firebase/crashlytics';
import analytics from '@react-native-firebase/analytics';

/* Types  ==================================================================== */
export enum LogEvents {
    EncryptionMigrationSuccess = 'encryption_migration_success',
    EncryptionMigrationException = 'encryption_migration_exception',
}

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
    levels: any;

    static MAX_LOG_SIZE = 500;

    constructor() {
        this.entries = [];
        this.isDEV = !!__DEV__;
        this.levels = {
            debug: { priority: 20 },
            warn: { priority: 40 },
            error: { priority: 50 },
        };
    }

    /**
     * log error in firebase crashlytics
     */
    logError = (message: string, exception: any) => {
        if (message) {
            crashlytics().log(message);
        }
        if (exception) {
            crashlytics().recordError(exception);
        }
    };

    /**
     * log an event in firebase analytics
     */
    logEvent = (event: LogEvents) => {
        analytics().logEvent(event);
    };

    /**
     * log error in session logs
     */
    recordError = (message: string, exception: any) => {
        const data = this.normalizeError(exception);
        this.addLogMessage('error', message, data);
    };

    /**
     * normalize error message
     */
    normalizeError = (err: any) => {
        if (!err) {
            return ErrorMessages.default;
        }
        let error = '';
        if (typeof err === 'string') {
            error = err;
        } else if (err.error && err.error.message) {
            error = err.error.message;
        } else if (err.message) {
            error = err.message;
        } else if (typeof err.toString === 'function') {
            error = err.toString();
        }
        if (!error) {
            error = ErrorMessages.default;
        }
        return error;
    };

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
            return (message: string, data: any) => {
                if (data instanceof Error) {
                    data = this.normalizeError(data);
                }

                if (!data) {
                    data = '';
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
        this.entries.push({
            timestamp: this.getTimeStamp(),
            level,
            message,
            data,
        });

        if (this.entries.length > LoggerService.MAX_LOG_SIZE) {
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
