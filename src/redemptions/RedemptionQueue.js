
export class RedemptionQueue {

    constructor(store, options={}) {
        this.redux = store;         // so we can dispatch / getState if needed
        this.activeRewardId = null; // task currently in progress

        this.globalCooldown = options.cooldown || 0;
        this.concurrent = false;    // When true, tasks will be run as they arrive; False, tasks will be run serially
        this.tickInverval = options.tickInverval || 250; // 1/4s delay max between ticks

        // Start the run
        // noinspection JSIgnoredPromiseFromCall
        // this._tryProcessQueue();
        this._watchQueue();
    }

    _watchQueue() {
        let lastQueue = this._getQueueContents();
        this.redux.subscribe(() => {
            let newQueue = this._getQueueContents();
            if (newQueue !== lastQueue) {
                console.log('RedemptionQueue: queue changed, triggering processor', newQueue, lastQueue, newQueue === lastQueue);
                if (newQueue.length > 0) {
                    // noinspection JSIgnoredPromiseFromCall
                    this._tryProcessQueue();
                }
            }
            lastQueue = newQueue;
        });
    }

    /**
     * Process the queue, recursively
     * @returns {Promise<*>}
     * @protected
     */
    async _tryProcessQueue() {
        await this._cooldown(this.tickInverval);
        return this._process();
    }

    /**
     * Main queue processor
     * @returns {Promise<*>}
     * @protected
     */
    async _process() {

        // Check if currently running another task async
        if (this.activeRewardId) {
            console.log('RedemptionQueue: skipping _process: busy');
            // return this._tryProcessQueue(); // try waiting for the next task
            return; // the current task processor will re-trigger the queue
        }

        // Pull reward task off top of queue
        const task = await this._getNextReward();
        this.activeRewardId = task;


        // No task? stop
        if (!task) {
            console.log('RedemptionQueue: skipping _process: no task')
            // return this._tryProcessQueue(); // try waiting for the next task
            return; // wait for state change to re-trigger the queue
        }


        try {
            // TODO: could put task into redux if desire to show visibility into the queue processor

            // Do the task
            if (this.concurrent) {
                // noinspection ES6MissingAwait
                console.log('RedemptionQueue: processing %s concurrently', task);
                this._execute(task);    // ignore completion of the task
            } else {
                console.log('RedemptionQueue: processing %s serially', task)
                await this._execute(task);
            }

        } catch (err) {
            console.error('RedemptionQueue: Caught exception', err);
        }

        // Global cooldown?
        await this._cooldown();

        // Unlock the queue
        console.log('RedemptionQueue: processing completed');
        this.activeRewardId = null;

        // Try doing the next task
        return this._tryProcessQueue();
    }

    /**
     * Cooldown sleep
     * @param millis
     * @returns {Promise<void>|Promise<unknown>}
     * @protected
     */
    _cooldown(millis = this.globalCooldown) {
        if (millis > 0) {
            return new Promise(resolve => setTimeout(resolve, millis));
        }
        return Promise.resolve();
    }

    async _getNextReward() {
        // Expected to be overridden
        return null; // expected to return the next item from the queue state
    }

    _getQueueContents() {
        // Expected to be overridden
        return ['this should not be called'];
    }

    async _execute(task) {
        // Expected to be overridden (scene, source queues
    }

}