const detox = require('detox/internals');

class DetoxCucumberAdapter {
    constructor(d) {
        this.detox = d;
    }

    async beforeEach(context) {
        await this.detox.onTestStart({
            title: context.pickle.uri,
            fullName: context.pickle.name,
            status: 'running',
        });
    }

    async afterEach(context) {
        await this.detox.onTestDone({
            title: context.pickle.uri,
            fullName: context.pickle.name,
            status: this.mapStatus(context, true),
            timedOut: context.result.duration,
        });
    }

    // eslint-disable-next-line class-methods-use-this
    mapStatus(context) {
        switch (context.result.status) {
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
