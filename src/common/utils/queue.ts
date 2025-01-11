export class PromiseQueue {
    private queue: Map<string, () => Promise<any>> = new Map();
    private activeCount: number = 0;
    private concurrency: number;

    constructor(concurrency: number) {
        this.concurrency = concurrency;
    }

    private async runNext() {
        if (this.activeCount >= this.concurrency || this.queue.size === 0) {
            return;
        }

        const [key, task] = this.queue.entries().next().value;
        if (!task) {
            return;
        }

        this.queue.delete(key);
        this.activeCount++;
        try {
            await task();
        } finally {
            this.activeCount--;
            this.runNext();
        }
    }

    enqueue(key: string, task: () => Promise<any>) {
        if (!this.queue.has(key)) {
            this.queue.set(key, task);
            this.runNext();
        }
    }
}
