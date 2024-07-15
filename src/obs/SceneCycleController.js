import {setScene, setSceneCycleSceneIndex, stopSceneCycle} from "./OBSActions";

export default class SceneCycleController {
    constructor(store, options={}) {
        this.redux = store;         // so we can dispatch / getState if needed

        this.defaultSceneDuration = options.defaultDuration || 10;

        // Watch for state changes
        this.watchState();
    }

    watchState() {
        let { cycleEnabled, activeCycle, activeCycleSceneIndex, currentProgramSceneName, cyclePaused } = this.getState();
        this.redux.subscribe(() => {
            let {
                cycleEnabled: newCycleEnabled,
                activeCycle: newActiveCycle,
                activeCycleSceneIndex: newActiveCycleSceneIndex,
                currentProgramSceneName: newCurrentProgramSceneName,
                cyclePaused: newCyclePaused
            } = this.getState();

            let enabledChanged, groupChanged, pauseChanged;

            if (newCycleEnabled !== cycleEnabled) {
                console.log('SceneCycleController: enabled changed', newCycleEnabled);
                enabledChanged = true;
            }

            if (newActiveCycle !== activeCycle) {
                console.log('SceneCycleController: cycle group changed', newActiveCycle);
                groupChanged = true;
            }

            if (newCyclePaused !== cyclePaused) {
                console.log('SceneCycleController: %s', (newCyclePaused ? 'paused' : 'un-paused'), newCyclePaused);
                pauseChanged = true;
            }

            if (newActiveCycleSceneIndex !== activeCycleSceneIndex) {
                console.log('SceneCycleController: scene index changed', newActiveCycleSceneIndex)
            }

            if (newCurrentProgramSceneName !== currentProgramSceneName) {
                console.log('SceneCycleController: obs scene changed', newCurrentProgramSceneName)
            }

            // Update last known values
            cycleEnabled = newCycleEnabled;
            activeCycle = newActiveCycle;
            activeCycleSceneIndex = newActiveCycleSceneIndex;
            currentProgramSceneName = newCurrentProgramSceneName;
            cyclePaused = newCyclePaused;

            // Trigger events
            if (enabledChanged || groupChanged || pauseChanged) {
                if (newCycleEnabled && newActiveCycle && !newCyclePaused) {
                    this.onStartCycle(!newCycleEnabled && !newActiveCycle && pauseChanged);
                } else {
                    this.onStopCycle();
                }
            }

        });
    }

    onStopCycle() {
        console.log('SceneCycleController: stop cycle');
        this._clearLoopHandle();
    }

    async onStartCycle(unpausedOnly) {
        const { activeCycle, activeCycleSceneIndex, currentProgramSceneName } = this.getState();
        const dispatch = this.redux.dispatch;

        // - check if current scene in the list, if so, start there
        // const startIndex= Math.max(0, activeCycle.scenes.findIndex(scene => scene.sceneName === currentProgramSceneName));
        let startIndex= activeCycle.scenes.findIndex(scene => scene.sceneName === currentProgramSceneName);
        if (startIndex < 0) startIndex = activeCycle.scenes.length-1; // Set to last scene so the first scene is the one cycled in first

        // Set starting scene index
        if (startIndex !== activeCycleSceneIndex) dispatch(setSceneCycleSceneIndex(startIndex));

        console.log('SceneCycleController: start cycle', activeCycle, startIndex);

        // Delay before the base scene duration before switching scenes
        // if (activeCycle.scenes[startIndex].sceneName !== currentProgramSceneName) {
        //     await this._cooldown(activeCycle.duration);
        // }

        // Delay the default when starting, unless just unpaused
        if (!unpausedOnly) {
            await this._cooldown(activeCycle.duration * 1000);
        } else {
            console.log('SceneCycleController: unpaused-only, skipping resume delay');
        }

        // Loop the scenes
        return this._sceneLoop();
    }

    async _sceneLoop() {
        const { activeCycle, activeCycleSceneIndex, cycleEnabled, cyclePaused } = this.getState();
        const dispatch = this.redux.dispatch;

        // Clear any dangling timeout, just in case this was fired in parallel
        this._clearLoopHandle();

        // If disabled, paused, or activeCycle is gone, stop
        if (!cycleEnabled || !activeCycle || cyclePaused) {
            console.log('SceneCycleController: ending loop cycle', { cycleEnabled, cyclePaused, activeCycle });
            return;
        }

        // Filter valid scenes
        const validScenes = activeCycle.scenes.filter(scene => scene.sceneName && scene.enabled);

        // Get next scene index
        let nextIndex = activeCycleSceneIndex+1;
        if (nextIndex >= activeCycle.scenes.length) nextIndex = 0; // Roll over back to start

        // Check if the scene is valid
        const nextScene = activeCycle.scenes[nextIndex];
        let skip = false;
        if (!nextScene.sceneName) {
            console.log('SceneCycleController: skipping unset scene, index=%s', nextIndex);
            skip = true;
        }

        // Check if scene is enabled
        if (!nextScene.enabled) {
            console.log('SceneCycleController: skipping disabled scene: %s, index=%s', nextScene.sceneName, nextIndex);
            skip = true;
        }

        if (skip) {
            if (validScenes.length === 0) {
                // stop cycling since there are no scenes available
                console.log('SceneCycleController: ending loop cycle: no valid scenes');
                dispatch(stopSceneCycle());
                dispatch(setSceneCycleSceneIndex(nextIndex));
                return;
            }

            // Update the current scene index
            dispatch(setSceneCycleSceneIndex(nextIndex));

            // Skip this scene entry, break the call stack
            this._loopHandle = setTimeout(() => {
                this._sceneLoop();
            }, 10);
            return;
        }

        // Set the scene
        console.log('SceneCycleController: setting scene', nextScene.sceneName);
        await dispatch(setScene(nextScene.sceneName));

        // Update the current scene index
        dispatch(setSceneCycleSceneIndex(nextIndex))

        // Get the scene duration time
        const sceneTimeoutMs = (nextScene.duration || activeCycle.duration || this.defaultSceneDuration) * 1000;

        // Loop after scene delay
        this._loopHandle = setTimeout(() => {
            this._sceneLoop();
        }, sceneTimeoutMs);

    }

    _clearLoopHandle() {
        clearTimeout(this._loopHandle);
        clearTimeout(this._cooldownTimeout);
    }

    /**
     * Cooldown sleep
     * @param millis
     * @returns {Promise<void>|Promise<unknown>}
     * @protected
     */
    _cooldown(millis) {
        if (millis > 0) {
            return new Promise(resolve => {
                this._cooldownTimeout = setTimeout(resolve, millis);
            });
            // this could leave dangling promises in memory as a leak, but whatever.
            // ... don't spam the start/stop button so fast then
        }
        return Promise.resolve();
    }


    getState() {
        const { cycleEnabled, activeCycle, activeCycleSceneIndex, currentProgramSceneName, cyclePaused } = this.redux.getState().obs;
        return { cycleEnabled, activeCycle, activeCycleSceneIndex, currentProgramSceneName, cyclePaused };
    }
}