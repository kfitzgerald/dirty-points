import OBSWebSocket from 'obs-websocket-js';

let started = false;
export const obs = new OBSWebSocket();
window.obs = obs;

export async function connect(password, host='localhost', port=4455) {
    if (started) return;
    started = true;

    try {
        const {
            obsWebSocketVersion,
            negotiatedRpcVersion
        } = await obs.connect(`ws://${host}:${port}`, password, {
            rpcVersion: 1
        });
        console.log(`Connected to server ${obsWebSocketVersion} (using RPC ${negotiatedRpcVersion})`)
    } catch (error) {
        console.error('Failed to connect', error.code, error.message);
        throw error;
    }
}

export async function disconnect() {
    try {
        started = false;
        await obs.disconnect();
        console.log('Disconnected from OBS');
    } catch (err) {
        console.error('Failed to disconnect from OBS');
        throw err;
    }
}

export async function getSceneList() {
    try {
        const {
            currentPreviewSceneName,
            currentProgramSceneName,
            scenes
        } = await obs.call('GetSceneList');
        return {
            currentPreviewSceneName,
            currentProgramSceneName,
            scenes
        };
    } catch (err) {
        console.error('Failed to get the scene list');
        throw err;
    }
}

export async function setScene(sceneName) {
    try {
        return await obs.call('SetCurrentProgramScene', { sceneName });
    } catch (err) {
        console.error('Failed to set scene', { sceneName, err });
        throw err;
    }
}

/**
 *
 * @param {EventSubChannelRedemptionAddEvent} event
 * @returns {Promise<void>}
 */
export async function onRedemption(event) {
    // set the scene
    // event.rewardId
    if (event.rewardTitle === 'Camera: Side/Decks') {
        setScene('Scene');
    } else if (event.rewardTitle === 'Camera: Main/Front') {
        setScene('Scene 2');
    }

}