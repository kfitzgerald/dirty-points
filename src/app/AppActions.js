
// Action to emit when a fatal error occurs - app can show a crash screen
export const APP_CRASH = 'APP_CRASH';
export function crashApp(error, errorInfo) {
    return {
        type: APP_CRASH,
        error,
        errorInfo
    };
}

export const SET_PREFERENCE = 'SET_PREFERENCE';
export function setPreference(key, value) {
    return {
        type: SET_PREFERENCE,
        key,
        value
    };
}

export const IMPORT_SETTINGS = 'IMPORT_SETTINGS';
export function importSettings(data) {
    return {
        type: IMPORT_SETTINGS,
        ...data
    };
}

export const SET_FULL_STOP_ENABLED = 'SET_FULL_STOP_ENABLED';
export function setFullStopEnabled(enabled) {
    return {
        type: SET_FULL_STOP_ENABLED,
        enabled
    };
}

