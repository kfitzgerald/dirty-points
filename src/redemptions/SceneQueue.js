import {RedemptionQueue} from "./RedemptionQueue";
import {convertStringMapping} from "./RewardUtil";
import {setScene, setSceneCyclePaused} from "../obs/OBSActions";
import {getNextQueuedSceneReward} from "./RedemptionActions";

export class SceneQueue extends RedemptionQueue {

    constructor(store, options={}) {
        super(store, options);
    }

    _getQueueContents() {
        const { getState } = this.redux;
        return getState().redemptions.sceneRedemptionQueue;
    }

    async _getNextReward() {
        const { dispatch } = this.redux;
        return await dispatch(getNextQueuedSceneReward());
    }

    async _execute(rewardId) {
        const { getState, dispatch } = this.redux;
        const {redemptions} = getState();
        const {mappings} = redemptions;

        // Get the mapping for the reward
        let mapping = mappings[rewardId];
        if (!mapping) {
            // No mapping? no process
            console.info(`SceneQueue: Reward ${rewardId} is not mapped`);
            return false;
        }

        // Convert old mappings if still around
        if (typeof mapping === 'string') mapping = convertStringMapping(mapping);

        // Pull vars out so if the mapping is changed mid-process it won't cause any issues
        const { sceneName, timeoutScene, timeout } = mapping;

        // Pause scene cycle controller
        await dispatch(setSceneCyclePaused(true));

        // Set scene
        await dispatch(setScene(sceneName));

        // Handle timeout
        if (timeout > 0 && timeoutScene) {

            // Wait for reward timeout
            await this._cooldown(timeout * 1000);

            // Unpause scene cycle controller
            await dispatch(setSceneCyclePaused(false));

            // Check if the scene was changed from the mapping (e.g. manually changed)
            const {obs} = getState();
            const {currentProgramSceneName} = obs;
            if (currentProgramSceneName !== sceneName) {
                console.info('SceneQueue: scene was changed, skipping exit scene change');
                return true;
            }

            // Check if there are pending scene changes
            if (this._getQueueContents().length > 0) {
                console.info('SceneQueue: there are waiting scene changes, skipping exit scene change');
                return true;
            }

            // If the cycle controller is running but paused, skip the timeout scene
            if (obs.cycleEnabled && obs.activeCycle) {
                // skip setting timeout scene
                console.info('SceneQueue: cycle controller is active, skipping exit scene change');
            } else {
                // Set the return scene in the mapping
                await dispatch(setScene(timeoutScene));
            }

            // Done!
            return true;
        }

        // Unpause scene cycle controller
        await dispatch(setSceneCyclePaused(false));
    }
}