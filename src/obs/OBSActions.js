import OBSWebSocket from "obs-websocket-js";

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

            obsWebSocket.on('CurrentProgramSceneChanged', onCurrentProgramSceneChanged);
            obsWebSocket.on('CurrentPreviewSceneChanged', onCurrentPreviewSceneChanged);
            obsWebSocket.once('ExitStarted', () => {
                console.info('OBS started shutdown');
                obsWebSocket.off('CurrentProgramSceneChanged', onCurrentProgramSceneChanged);
                obsWebSocket.off('CurrentPreviewSceneChanged', onCurrentPreviewSceneChanged);
            });

            // update the scene list on connect
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

        } catch (err) {
            console.error('Failed to get the scene list');
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
            for (let scene of [...scenes]) { // <-- important to break the relationship between state cuz it will break with updates
                await dispatch(fetchSceneItemList(scene.sceneName));
            }

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
            return sceneItems;

        } catch (err) {
            console.error('Failed to get the scene item list');
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

//endregion