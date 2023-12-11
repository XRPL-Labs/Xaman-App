const detox = require('detox/internals');

class DetoxCucumberAdapter {
    constructor(d) {
        this.detox = d;
        this.testFailed = false;
    }

    async beforeEach(context) {
        if (this.testFailed) {
            throw new Error('Force stop');
        }

        await this.detox.onTestStart({
            title: context.pickle.uri,
            fullName: context.pickle.name,
            status: 'running',
        });
    }

    async afterEach(context) {
        const { pickle, result } = context;

        const status = this.mapStatus(result);

        if (status === 'failed') {
            this.testFailed = true;
        }

        await this.detox.onTestDone({
            title: pickle.uri,
            fullName: pickle.name,
            status,
            timedOut: result.duration,
        });
    }

    // eslint-disable-next-line class-methods-use-this
    mapStatus(result) {
        switch (result.status) {
            case 'passed':
                return 'passed';
            case 'failed':
                return 'failed';
            default:
                return 'failed';
        }
    }
}

module.exports = new DetoxCucumberAdapter(detox);
