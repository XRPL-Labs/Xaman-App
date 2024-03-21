import Meta from '../meta';

import metaFixtures from './fixtures/meta.json';

describe('Meta Parser', () => {
    it('Should get hooks executions', () => {
        const instance = new Meta(metaFixtures.withHookExecutions);
        expect(instance.parseHookExecutions()).toMatchObject(
            metaFixtures.withHookExecutions.HookExecutions.map((e) => e.HookExecution),
        );
    });
});
