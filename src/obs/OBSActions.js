import OBSWebSocket from "obs-websocket-js";
import moment from "moment";
import {setFullStopEnabled} from "../app/AppActions";

//region Websocket

const obsWebSocket = new OBSWebSocket();

export const UPDATE_OBS_CONNECTION_INFO = 'UPDATE_OBS_CONNECTION_INFO';
export function updateOBSConnectionInfo({ password, host='localhost', port=4455 }) {
    return {
        type: UPDATE_OBS_CONNECTION_INFO,
        host,
        port,
        password
    };
}

export const OBS_CONNECTION_STATUS = {
    connected: 'connected',
    connecting: 'connecting',
    disconnected: 'disconnected',
};

export const UPDATE_OBS_CONNECTION_STATE = 'UPDATE_OBS_CONNECTION_STATE';
export function updateOBSConnectionState(status, error) {
    return {
        type: UPDATE_OBS_CONNECTION_STATE,
        status,
        error
    };
}

export const UPDATE_OBS_ERROR = 'UPDATE_OBS_ERROR';
export function updateOBSError(error) {
    return {
        type: UPDATE_OBS_ERROR,
        error
    };
}

export function connectToOBS() {
    return async (dispatch, getState) => {
        const { obs } = getState();
        const { status, host, port, password } = obs;

        // no double connects
        if (status !== OBS_CONNECTION_STATUS.disconnected) return;
        dispatch(updateOBSConnectionState(OBS_CONNECTION_STATUS.connecting, null));

        try {
            const {
                obsWebSocketVersion,
                negotiatedRpcVersion
            } = await obsWebSocket.connect(`ws://${host}:${port}`, password, {
                rpcVersion: 1
            });
            console.info(`Connected to server ${obsWebSocketVersion} (using RPC ${negotiatedRpcVersion})`)
            dispatch(updateOBSConnectionState(OBS_CONNECTION_STATUS.connected, null));

            // When scene changes, update internal state
            function onCurrentProgramSceneChanged(event) {
                dispatch(updateOBSCurrentScenes({
                    currentProgramSceneName: event.sceneName,
                }));
            }

            function onCurrentPreviewSceneChanged(event) {
                dispatch(updateOBSCurrentScenes({
                    currentPreviewSceneName: event.sceneName,
                }));
            }

            function onSceneNameChanged(event) {
                dispatch(OBSSceneNameChanged({
                    sceneUuid: event.sceneUuid,
                    oldSceneName: event.oldSceneName,
                    sceneName: event.sceneName
                }));
            }

            function onSceneCreated(event) {
                dispatch(OBSSceneCreated({
                    sceneUuid: event.sceneUuid,
                    sceneName: event.sceneName,
                    isGroup: event.isGroup,
                }));
            }

            function onSceneRemoved(event) {
                dispatch(OBSSceneRemoved({
                    sceneUuid: event.sceneUuid,
                    sceneName: event.sceneName,
                    isGroup: event.isGroup,
                }));
            }

            function onSceneListChanged(event) {
                dispatch(OBSSceneListChanged({
                    scenes: event.scenes
                }));
            }

            function onSceneItemCreated(event) {
                // Notify created
                dispatch(OBSSceneItemCreated(event));

                // Refresh item list
                dispatch(fetchSceneItemList(event.sceneName));
            }

            function onSceneItemRemoved(event) {
                // Notify removed
                dispatch(OBSSceneItemRemoved(event));

                // Refresh item list
                dispatch(fetchSceneItemList(event.sceneName));
            }

            function onSceneItemListReIndexed(event) {
                dispatch(fetchSceneItemList(event.sceneName)); // Only handle refresh for reordering
            }

            function onStudioModeStateChanged(event) {
                dispatch(setFullStopEnabled(event.studioModeEnabled)); // Full stop on studio mode
            }

            function onSourceFilterCreated(event) {
                // https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#sourcefiltercreated
                dispatch(fetchSourceFilterList(null, event.sourceName));
            }

            function onSourceFilterRemoved(event) {
                // https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#sourcefilterremoved
                dispatch(fetchSourceFilterList(null, event.sourceName));
            }

            function onSourceFilterNameChanged(event) {
                // https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#sourcefilternamechanged
                dispatch(fetchSourceFilterList(null, event.sourceName));
            }

            function onSourceFilterEnableStateChanged(event) {
                // https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#sourcefilterenablestatechanged
                dispatch(updateOBSSourceFilterEnabled(event.sourceName, event.filterName, event.filterEnabled));
            }

            function onReplayBufferStateChanged(event) {
                // https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#replaybufferstatechanged
                dispatch(updateOBSReplayBufferStatus(event))
            }

            function onReplayBufferSaved(event) {
                // https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#replaybuffersaved
                dispatch(replayBufferSaved(event.savedReplayPath))
            }

            function onStreamStateChanged(event) {
                // https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#streamstatechanged
                dispatch(updateOBSStreamStatus(event))
            }

            function onSceneTransitionStarted(/*event*/) {
                // https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#scenetransitionstarted
                dispatch(setTransitioningStatus(true))
            }

            function onSceneTransitionEnded(/*event*/) {
                // https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#scenetransitionended
                dispatch(setTransitioningStatus(false))
            }

            // Events
            obsWebSocket.on('CurrentProgramSceneChanged', onCurrentProgramSceneChanged);
            obsWebSocket.on('CurrentPreviewSceneChanged', onCurrentPreviewSceneChanged);
            obsWebSocket.on('SceneNameChanged', onSceneNameChanged);
            obsWebSocket.on('SceneCreated', onSceneCreated);
            obsWebSocket.on('SceneRemoved', onSceneRemoved);
            obsWebSocket.on('SceneListChanged', onSceneListChanged);
            obsWebSocket.on('SceneItemCreated', onSceneItemCreated);
            obsWebSocket.on('SceneItemRemoved', onSceneItemRemoved);
            obsWebSocket.on('SceneItemListReindexed', onSceneItemListReIndexed);
            obsWebSocket.on('StudioModeStateChanged', onStudioModeStateChanged);
            obsWebSocket.on('SourceFilterCreated', onSourceFilterCreated);
            obsWebSocket.on('SourceFilterRemoved', onSourceFilterRemoved);
            obsWebSocket.on('SourceFilterNameChanged', onSourceFilterNameChanged);
            obsWebSocket.on('SourceFilterEnableStateChanged', onSourceFilterEnableStateChanged);
            obsWebSocket.on('ReplayBufferStateChanged', onReplayBufferStateChanged);
            obsWebSocket.on('ReplayBufferSaved', onReplayBufferSaved);
            obsWebSocket.on('StreamStateChanged', onStreamStateChanged);
            obsWebSocket.on('SceneTransitionStarted', onSceneTransitionStarted);
            obsWebSocket.on('SceneTransitionEnded', onSceneTransitionEnded);

            obsWebSocket.once('ExitStarted', () => {
                console.info('OBS started shutdown');
                obsWebSocket.off('CurrentProgramSceneChanged', onCurrentProgramSceneChanged);
                obsWebSocket.off('CurrentPreviewSceneChanged', onCurrentPreviewSceneChanged);
            });

            // update all the obs info on connect
            dispatch(fetchSceneList());

        } catch (error) {
            console.error('Failed to connect', error.code, error.message);
            dispatch(updateOBSConnectionState(OBS_CONNECTION_STATUS.disconnected, error));
        }

    };
}

export function disconnectFromOBS() {
    return async (dispatch, getState) => {
        const { obs } = getState();
        const { status } = obs;

        // no double disconnects
        if (status !== OBS_CONNECTION_STATUS.connected) return;

        try {
            await obsWebSocket.disconnect();
            console.info('Disconnected from OBS');
            dispatch(updateOBSConnectionState(OBS_CONNECTION_STATUS.disconnected, null));
        } catch (err) {
            console.error('Failed to disconnect from OBS');
            dispatch(updateOBSConnectionState(OBS_CONNECTION_STATUS.disconnected, err));
        }
    };
}

//endregion

//region Scene List

export const FULL_OBS_SCENE_UPDATE_STATUS = 'FULL_OBS_SCENE_UPDATE_STATUS';
export function setFullOBSSceneUpdateStatus(completed) {
    return {
        type: FULL_OBS_SCENE_UPDATE_STATUS,
        completed
    };
}

export const UPDATE_OBS_SCENE_LIST = 'UPDATE_OBS_SCENE_LIST';
export function updateOBSSceneList(scenes) {
    return {
        type: UPDATE_OBS_SCENE_LIST,
        scenes
    };
}

export function fetchSceneList() {
    return async (dispatch, getState) => {
        const {obs} = getState();
        const {status} = obs;

        // Not connected, do nothing
        if (status !== OBS_CONNECTION_STATUS.connected) return;

        dispatch(setFullOBSSceneUpdateStatus(false));

        try {
            const {
                currentPreviewSceneName,
                currentProgramSceneName,
                scenes
            } = await obsWebSocket.call('GetSceneList');

            dispatch(updateOBSSceneList(scenes));
            dispatch(updateOBSCurrentScenes({
                currentPreviewSceneName,
                currentProgramSceneName,
            }));

            // Refresh scene items
            await dispatch(fetchAllSceneItems());

            // Sync studio mode state
            await dispatch(syncStudioMode());

            // Sync stream status
            await dispatch(getStreamStatus());

            // Sync replay buffer status
            await dispatch(getReplayBufferStatus());

            // Sync profile settings
            await dispatch(getProfileSettings());

            // Retrieve recording path
            await dispatch(getRecordingPath());

            // Flag that we're done syncing
            dispatch(setFullOBSSceneUpdateStatus(true));

        } catch (err) {
            console.error('Failed to get the scene list');
            dispatch(updateOBSError(err));
        }

    };
}

export function syncStudioMode() {
    return async (dispatch, getState) => {
        const {obs} = getState();
        const {status} = obs;

        // Not connected, do nothing
        if (status !== OBS_CONNECTION_STATUS.connected) return;

        try {
            const {
                studioModeEnabled
            } = await obsWebSocket.call('GetStudioModeEnabled');

            // Sync full stop to studio mode state
            dispatch(setFullStopEnabled(studioModeEnabled)); // Full stop on studio mode

        } catch (err) {
            console.error('Failed to get studio mode state');
            dispatch(updateOBSError(err));
        }

    };
}

//endregion

//region Scene Items

export const UPDATE_OBS_SCENE_ITEM_LIST = 'UPDATE_OBS_SCENE_ITEM_LIST';
export function updateOBSSceneItemList(sceneName, sceneItems) {
    return {
        type: UPDATE_OBS_SCENE_ITEM_LIST,
        sceneItems,
        sceneName
    };
}

export function fetchAllSceneItems() {
    return async (dispatch, getState) => {
        const {obs} = getState();
        const {status, scenes} = obs;

        // Not connected, do nothing
        if (status !== OBS_CONNECTION_STATUS.connected) return;

        try {

            // Fetch scene items
            const sceneFilters = {};
            let filters;
            for (let scene of [...scenes]) { // <-- important to break the relationship between state cuz it will break with updates
                await dispatch(fetchSceneItemList(scene.sceneName));

                // Fetch scene filters too
                filters = await dispatch(fetchSourceFilterList(scene.sceneName, null, false));
                sceneFilters[scene.sceneName] = filters;
            }

            // Dispatch bulk update
            dispatch(updateOBSSourceFilterListBulk(sceneFilters))

        } catch (err) {
            console.error('Failed to get the scene item list');
            dispatch(updateOBSError(err));
        }

    };
}

export function fetchSceneItemList(sceneName) {
    return async (dispatch, getState) => {
        const {obs} = getState();
        const {status} = obs;

        // Not connected, do nothing
        if (status !== OBS_CONNECTION_STATUS.connected) return;

        try {
            const {
                sceneItems
            } = await obsWebSocket.call('GetSceneItemList', {
                sceneName
            });

            dispatch(updateOBSSceneItemList(sceneName, sceneItems));

            // For each source, get filters
            let filters;
            const sourceFilters = {};
            for (let source of sceneItems) {
                if (!sourceFilters[source.sourceName]) {
                    filters = await dispatch(fetchSourceFilterList(sceneName, source.sourceName, false));
                    sourceFilters[source.sourceName] = filters;
                }
            }

            // Bulk update redux in one go
            dispatch(updateOBSSourceFilterListBulk(sourceFilters));

            return sceneItems;

        } catch (err) {
            console.error('Failed to get the scene item list');
            dispatch(updateOBSError(err));
        }

    };
}

//endregion

//region Filters

export const UPDATE_OBS_SOURCE_FILTER_LIST = 'UPDATE_OBS_SOURCE_FILTER_LIST';
export function updateOBSSourceFilterList(sceneName, sourceName, filters) {
    return {
        type: UPDATE_OBS_SOURCE_FILTER_LIST,
        sceneName,
        sourceName,
        filters
    };
}

export const UPDATE_OBS_SOURCE_FILTER_LIST_BULK = 'UPDATE_OBS_SOURCE_FILTER_LIST_BULK';
export function updateOBSSourceFilterListBulk(map) {
    return {
        type: UPDATE_OBS_SOURCE_FILTER_LIST_BULK,
        map
    };
}

export const UPDATE_OBS_SOURCE_FILTER_ENABLED = 'UPDATE_OBS_SOURCE_FILTER_ENABLED';
export function updateOBSSourceFilterEnabled(sourceName, filterName, enabled) {
    return {
        type: UPDATE_OBS_SOURCE_FILTER_ENABLED,
        sourceName,
        filterName,
        enabled
    };
}

export function fetchSourceFilterList(sceneName, sourceName=null, doDispatch=true) {
    return async (dispatch, getState) => {
        const {obs} = getState();
        const {status} = obs;

        // Not connected, do nothing
        if (status !== OBS_CONNECTION_STATUS.connected) return;

        try {
            const { filters } = await obsWebSocket.call('GetSourceFilterList', {
                sourceName: !sourceName ? sceneName : sourceName, // get filters for scene if source is missing
                // sourceUuid
            });

            // Suppress dispatch if requested
            if (doDispatch) dispatch(updateOBSSourceFilterList(sceneName, sourceName, filters));

            return filters;

        } catch (err) {
            console.error('Failed to get the scene filter list', err);
            dispatch(updateOBSError(err));
        }

    };
}

export function setSourceFilterEnabled(sourceName, filterName, filterEnabled) {
    return async (dispatch, getState) => {
        const {obs} = getState();
        const {status} = obs;

        // Not connected, do nothing
        if (status !== OBS_CONNECTION_STATUS.connected) return;

        try {
            console.info('Toggling source filter %s -> %s: %s', sourceName, filterName, filterEnabled);
            await obsWebSocket.call('SetSourceFilterEnabled', {
                sourceName,
                filterName,
                filterEnabled
            });
        } catch (err) {
            console.error('Failed to set filter enabled', { sourceName, filterName, err });
            dispatch(updateOBSError(err));
        }
    };
}

//endregion

//region Update Scene

export const UPDATE_OBS_CURRENT_SCENES = 'UPDATE_OBS_CURRENT_SCENES';
export function updateOBSCurrentScenes({ currentPreviewSceneName, currentProgramSceneName }) {
    return {
        type: UPDATE_OBS_CURRENT_SCENES,
        currentPreviewSceneName,
        currentProgramSceneName
    };
}

export function setScene(sceneName) {
    return async (dispatch, getState) => {
        const {obs} = getState();
        const {status} = obs;

        // Not connected, do nothing
        if (status !== OBS_CONNECTION_STATUS.connected) return;

        try {
            console.info('Changing scene: %s', sceneName);
            await obsWebSocket.call('SetCurrentProgramScene', { sceneName });
            // don't have to do this here because the websocket will tell us it happened
            // dispatch(updateOBSCurrentScenes({
            //     currentProgramSceneName: sceneName
            // }));
        } catch (err) {
            console.error('Failed to set scene', { sceneName, err });
            dispatch(updateOBSError(err));
        }
    };
}


export const OBS_SCENE_NAME_CHANGED = 'OBS_SCENE_NAME_CHANGED';
export function OBSSceneNameChanged({ sceneUuid, oldSceneName, sceneName }) {
    return {
        type: OBS_SCENE_NAME_CHANGED,
        sceneUuid,
        oldSceneName,
        sceneName
    };
}

export const OBS_SCENE_REMOVED = 'OBS_SCENE_REMOVED';
export function OBSSceneRemoved({ sceneUuid, sceneName, isGroup }) {
    return {
        type: OBS_SCENE_REMOVED,
        sceneUuid,
        sceneName,
        isGroup,
    };
}

export const OBS_SCENE_CREATED = 'OBS_SCENE_CREATED';
export function OBSSceneCreated({ sceneUuid, sceneName, isGroup }) {
    return {
        type: OBS_SCENE_CREATED,
        sceneUuid,
        sceneName,
        isGroup,
    };
}

export const OBS_SCENE_LIST_CHANGED = 'OBS_SCENE_LIST_CHANGED';
export function OBSSceneListChanged({ scenes }) {
    return {
        type: OBS_SCENE_LIST_CHANGED,
        scenes
    };
}

export const OBS_SCENE_ITEM_CREATED = 'OBS_SCENE_ITEM_CREATED';
export function OBSSceneItemCreated({ sceneName,
                                        sceneUuid,
                                        sourceName,
                                        sourceUuid,
                                        sceneItemId,
                                        sceneItemIndex }) {
    return {
        type: OBS_SCENE_ITEM_CREATED,
        sceneName,
        sceneUuid,
        sourceName,
        sourceUuid,
        sceneItemId,
        sceneItemIndex
    };
}

export const OBS_SCENE_ITEM_REMOVED = 'OBS_SCENE_ITEM_REMOVED';
export function OBSSceneItemRemoved({ sceneName,
                                        sceneUuid,
                                        sourceName,
                                        sourceUuid,
                                        sceneItemId }) {
    return {
        type: OBS_SCENE_ITEM_REMOVED,
        sceneName,
        sceneUuid,
        sourceName,
        sourceUuid,
        sceneItemId,
    };
}

//endregion

//region Update Scene Items

export function setSceneItemEnabled(sceneName, sceneItemId, sceneItemEnabled) {
    return async (dispatch, getState) => {
        const {obs} = getState();
        const {status} = obs;

        // Not connected, do nothing
        if (status !== OBS_CONNECTION_STATUS.connected) return;

        try {
            console.info('Toggling scene source %s -> %s: %s', sceneName, sceneItemId, sceneItemEnabled);
            await obsWebSocket.call('SetSceneItemEnabled', {
                sceneName,
                sceneItemId,
                sceneItemEnabled
            });
        } catch (err) {
            console.error('Failed to set source enabled', { sceneName, sceneItemId, err });
            dispatch(updateOBSError(err));
        }
    };
}

//endregion

//region Scene Cycle

export const ADD_SCENE_CYCLE_GROUP = 'ADD_SCENE_CYCLE_GROUP';
export function addSceneCycleGroup(group) {
    return {
        type: ADD_SCENE_CYCLE_GROUP,
        group,
    };
}

export const UPDATE_SCENE_CYCLE_GROUP = 'UPDATE_SCENE_CYCLE_GROUP';
export function updateSceneCycleGroup(group, data) {
    return {
        type: UPDATE_SCENE_CYCLE_GROUP,
        group,
        data
    };
}

export const DELETE_SCENE_CYCLE_GROUP = 'DELETE_SCENE_CYCLE_GROUP';
export function deleteSceneCycleGroup(group) {
    return {
        type: DELETE_SCENE_CYCLE_GROUP,
        group,
    };
}

export const ADD_SCENE_CYCLE_GROUP_ITEM = 'ADD_SCENE_CYCLE_GROUP_ITEM';
export function addSceneCycleItem(group, item) {
    return {
        type: ADD_SCENE_CYCLE_GROUP_ITEM,
        group,
        item
    };
}

export const UPDATE_SCENE_CYCLE_GROUP_ITEM = 'UPDATE_SCENE_CYCLE_GROUP_ITEM';
export function updateSceneCycleItem(group, item, data) {
    return {
        type: UPDATE_SCENE_CYCLE_GROUP_ITEM,
        group,
        item,
        data
    };
}

export const REORDER_SCENE_CYCLE_GROUP_ITEM = 'REORDER_SCENE_CYCLE_GROUP_ITEM';
export function reorderSceneCycleItem(group, sourceIndex, destinationIndex) {
    return {
        type: REORDER_SCENE_CYCLE_GROUP_ITEM,
        group,
        sourceIndex,
        destinationIndex
    };
}

export const DELETE_SCENE_CYCLE_GROUP_ITEM = 'DELETE_SCENE_CYCLE_GROUP_ITEM';
export function deleteSceneCycleItem(group, item) {
    return {
        type: DELETE_SCENE_CYCLE_GROUP_ITEM,
        group,
        item
    };
}

export const START_SCENE_CYCLE = 'START_SCENE_CYCLE';
export function startSceneCycle(group=null, sceneIndex=null) {
    return {
        type: START_SCENE_CYCLE,
        group,
        sceneIndex
    };
}

export const SET_ACTIVE_SCENE_INDEX = 'SET_ACTIVE_SCENE_INDEX';
export function setSceneCycleSceneIndex(sceneIndex) {
    return {
        type: SET_ACTIVE_SCENE_INDEX,
        sceneIndex,
    };
}

export const STOP_SCENE_CYCLE = 'STOP_SCENE_CYCLE';
export function stopSceneCycle() {
    return {
        type: STOP_SCENE_CYCLE,
    };
}

export const SET_SCENE_CYCLE_PAUSED = 'SET_SCENE_CYCLE_PAUSED';
export function setSceneCyclePaused(paused) {
    return {
        type: SET_SCENE_CYCLE_PAUSED,
        paused
    };
}

export const SET_TRANSITIONING_STATUS = 'SET_TRANSITIONING_STATUS';
export function setTransitioningStatus(enabled) {
    return {
        type: SET_TRANSITIONING_STATUS,
        enabled
    };
}

//endregion

//region Replay Buffer

// ✅ GetStreamStatus -> { outputActive: boolean, outputState: 'starting' | 'started' | 'stopping' | 'stopped' }
// ✅ GetReplayBufferStatus -> { outputActive: boolean }
// ✅ ToggleReplayBuffer -> no args, toggles on/off -> { outputActive: boolean }
// ✅ StartReplayBuffer -> no response
// ✅ StopReplayBuffer -> no response
// ✅ SaveReplayBuffer -> no response
// GetLastReplayBufferReplay -> { savedReplayPath: string }
// ✅ GetProfileParameter -> { parameterCategory: string, parameterName: string} -> { parameterValue: string, defaultParameterValue: string }
// ✅ SetProfileParameter -> { parameterCategory: string, parameterName: string, parameterValue: any }

export const UPDATE_OBS_STREAM_STATUS = 'UPDATE_OBS_STREAM_STATUS';
export function updateOBSStreamStatus(status) {
    return {
        type: UPDATE_OBS_STREAM_STATUS,
        status
    };
}

export function getStreamStatus() {
    return async (dispatch, getState) => {
        const {obs} = getState();
        const {status} = obs;

        // Not connected, do nothing
        if (status !== OBS_CONNECTION_STATUS.connected) return;

        try {
            const status= await obsWebSocket.call('GetStreamStatus');

            dispatch(updateOBSStreamStatus(status));

        } catch (err) {
            console.error('Failed to get the stream status');
            dispatch(updateOBSError(err));
        }

    };
}

export const UPDATE_OBS_REPLAY_BUFFER_STATUS = 'UPDATE_OBS_REPLAY_BUFFER_STATUS';
export function updateOBSReplayBufferStatus(status) {
    return {
        type: UPDATE_OBS_REPLAY_BUFFER_STATUS,
        status
    };
}

export function getReplayBufferStatus() {
    return async (dispatch, getState) => {
        const {obs} = getState();
        const {status} = obs;

        // Not connected, do nothing
        if (status !== OBS_CONNECTION_STATUS.connected) return;

        try {
            const status = await obsWebSocket.call('GetReplayBufferStatus');

            dispatch(updateOBSReplayBufferStatus(status));

        } catch (err) {
            console.error('Failed to get the replay buffer status');
            dispatch(updateOBSError(err));
        }

    };
}

export const UPDATE_OBS_PROFILE_SETTINGS = 'UPDATE_OBS_PROFILE_SETTINGS';
export function updateOBSProfileSettings(settings) {
    return {
        type: UPDATE_OBS_PROFILE_SETTINGS,
        settings
    };
}

export const UPDATE_OBS_RECORDING_PATH = 'UPDATE_OBS_RECORDING_PATH';
export function updateOBSRecordingPath(recordDirectory) {
    return {
        type: UPDATE_OBS_RECORDING_PATH,
        recordDirectory
    };
}

export const REPLAY_BUFFER_SAVED = 'REPLAY_BUFFER_SAVED';
export function replayBufferSaved(savedReplayPath) {
    return {
        type: REPLAY_BUFFER_SAVED,
        savedReplayPath
    };
}

export function getProfileSettings() {
    return async (dispatch, getState) => {
        const {obs} = getState();
        const {status} = obs;

        // Not connected, do nothing
        if (status !== OBS_CONNECTION_STATUS.connected) return;

        try {
            const outputMode = await obsWebSocket.call('GetProfileParameter', { parameterCategory: 'Output', parameterName: 'Mode' })
            const parameterCategory = outputMode.parameterValue === 'Advanced' ? 'AdvOut' : 'SimpleOutput';
            const replayBufferEnabled = await obsWebSocket.call('GetProfileParameter', { parameterCategory, parameterName: 'RecRB' })
            const replayBufferTime = await obsWebSocket.call('GetProfileParameter', { parameterCategory, parameterName: 'RecRBTime' })
            const replayBufferSize = await obsWebSocket.call('GetProfileParameter', { parameterCategory, parameterName: 'RecRBSize' })
            const replayBufferPrefix = await obsWebSocket.call('GetProfileParameter', { parameterCategory, parameterName: 'RecRBPrefix' })

            const getCurrentValue = (param, formatter = (val) => val) => {
                if (param.parameterValue !== null) {
                    return formatter(param.parameterValue)
                } else if (param.defaultParameterValue !== null) {
                    return formatter(param.defaultParameterValue)
                } else {
                    return null;
                }
            }

            // console.log('get', { replayBufferEnabled, value: getCurrentValue(replayBufferEnabled, Boolean) })

            dispatch(updateOBSProfileSettings({
                outputMode: getCurrentValue(outputMode, String),
                replayBufferEnabled: getCurrentValue(replayBufferEnabled, (v) => v === 'true'),
                replayBufferTime: getCurrentValue(replayBufferTime, Number),
                replayBufferSize: getCurrentValue(replayBufferSize, Number),
                replayBufferPrefix: getCurrentValue(replayBufferPrefix, String),
            }));

        } catch (err) {
            console.error('Failed to get obs profile settings');
            dispatch(updateOBSError(err));
        }

    };
}

export function setProfileSettings(settings) {
    return async (dispatch, getState) => {
        const {obs} = getState();
        const {status, profileSettings} = obs;

        // Not connected, do nothing
        if (status !== OBS_CONNECTION_STATUS.connected) return;

        // No output mode, can't set any settings reliably
        if (!profileSettings.outputMode) return;

        try {
            const parameterCategory = profileSettings.outputMode === 'Advanced' ? 'AdvOut' : 'SimpleOutput';
            const keys = new Set(Object.keys(settings));
            if (keys.has('replayBufferEnabled')) await obsWebSocket.call('SetProfileParameter', { parameterCategory, parameterName: 'RecRB', parameterValue: String(settings.replayBufferEnabled) });
            if (keys.has('replayBufferTime')) await obsWebSocket.call('SetProfileParameter', { parameterCategory, parameterName: 'RecRBTime', parameterValue: String(settings.replayBufferTime) });
            if (keys.has('replayBufferSize')) await obsWebSocket.call('SetProfileParameter', { parameterCategory, parameterName: 'RecRBSize', parameterValue: String(settings.replayBufferSize) });
            if (keys.has('replayBufferPrefix')) await obsWebSocket.call('SetProfileParameter', { parameterCategory, parameterName: 'RecRBPrefix', parameterValue: String(settings.replayBufferPrefix) });

            // console.log('set', { replayBufferEnabled: String(settings.replayBufferEnabled) })

            // Delay for a second for OBS to apply the settings before refreshing, otherwise we might get the old value back
            // await new Promise(resolve => setTimeout(resolve, 1000));
            await dispatch(getProfileSettings()); // Refresh settings after change

        } catch (err) {
            console.error('Failed to set obs profile settings');
            dispatch(updateOBSError(err));
        }

    };
}

export function toggleReplayBufferEnabled(enabled = null) {
    return async (dispatch, getState) => {
        const {obs} = getState();
        const {status} = obs;

        // Not connected, do nothing
        if (status !== OBS_CONNECTION_STATUS.connected) return;

        try {
            // Do the action as provided
            if (enabled === null) {
                // Toggle whatever the current state is
                await obsWebSocket.call('ToggleReplayBuffer');
            } else {
                await obsWebSocket.call(enabled ? 'StartReplayBuffer' : 'StopReplayBuffer');
            }

        } catch (err) {
            console.error('Failed to update the replay buffer status');
            dispatch(updateOBSError(err));
        }

    };
}

let screenshotCounter = 0;

export function saveScreenshot() {
    return async (dispatch, getState) => {
        const { obs } = getState();
        const { status, currentProgramSceneName, recordDirectory } = obs;

        // Not connected, do nothing
        if (status !== OBS_CONNECTION_STATUS.connected) return;

        try {

            // TODO: make filename scheme configurable
            const filename = moment().format('YYYY-MM-DD_HH-mm-ss') + `-screenshot-${++screenshotCounter}.png`;

            // TODO: this could be updated to take screenshots of arbitrary sources instead of just the current scene, but for now this is good enough for mvp
            const payload = {
                sourceName: currentProgramSceneName,
                imageFormat: 'png',
                imageFilePath: `${recordDirectory}/${filename}`, // if null, OBS will generate a file path and return it in the response
            }

            await obsWebSocket.call('SaveSourceScreenshot', payload);

            console.log('Screenshot saved to', payload.imageFilePath);

        } catch (err) {
            console.error('Failed to save screenshot', err);
            dispatch(updateOBSError(err));
        }

    };
}

export function saveReplayBuffer() {
    return async (dispatch, getState) => {
        const { obs } = getState();
        const { status } = obs;

        // Not connected, do nothing
        if (status !== OBS_CONNECTION_STATUS.connected) return;

        try {
            await obsWebSocket.call('SaveReplayBuffer');
            console.log('Replay saved');
        } catch (err) {
            console.error('Failed to save replay buffer', err);
            dispatch(updateOBSError(err));
        }

    };
}

export function getRecordingPath() {
    return async (dispatch, getState) => {
        const { obs } = getState();
        const { status } = obs;

        // Not connected, do nothing
        if (status !== OBS_CONNECTION_STATUS.connected) return;

        try {

           const { recordDirectory } = await obsWebSocket.call('GetRecordDirectory');
           dispatch(updateOBSRecordingPath(recordDirectory));

        } catch (err) {
            console.error('Failed to retrieve the obs recording path', err);
            dispatch(updateOBSError(err));
        }

    };
}

// Get Profile Settings
// {defaultParameterValue: 'Output', parameterValue: 'Mode'}
// {defaultParameterValue: 'SimpleOutput', parameterValue: 'RecRB'} -> boolean
// {defaultParameterValue: 'SimpleOutput', parameterValue: 'RecRBTime'} -> number
// {defaultParameterValue: 'SimpleOutput', parameterValue: 'RecRBSize'} -> number
// {defaultParameterValue: 'SimpleOutput', parameterValue: 'RecRBPrefix'} -> string

// Events
// ReplayBufferStateChanged -> { outputActive: boolean, outputState: 'starting' | 'started' | 'stopping' | 'stopped' }
// ReplayBufferSaved -> { savedReplayPath: string }
// StreamStateChanged -> { outputActive: boolean, outputState: 'starting' | 'started' | 'stopping' | 'stopped' }


//endregion