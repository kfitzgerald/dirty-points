export const DEFAULT_PREFERENCES = {
};

// Auth: see https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#implicit-grant-flow
// Scopes we need:
export const REQUIRED_SCOPES = [
    'channel:manage:redemptions',       // so we can list/enable/disable redemptions
    'user:read:chat',
];

export const CHAT_BADGES = {
    Broadcaster: "broadcaster",
    Moderator: 'moderator',
    VIP: 'vip',
    Subscriber: 'subscriber',
    Artist: 'artist-badge',
    TwitchDJ: 'twitch-dj'

    // Other options
    // Admin: 'admin',
    // SubGifter: 'sub-gifter',
    // Bits: 'bits',
    // Staff: 'staff',
    // Turbo: 'turbo',
    // Founder: 'founder',
    // Partner: 'partner'
};

export const MAPPING_TYPES = {
    SCENE_CHANGE: 'scene-change',
    SOURCE_TOGGLE: 'source-toggle',
    FILTER_TOGGLE: 'filter-toggle',
    SPECIAL_ACTION: 'special-action',
};

export const OBS_SPECIAL_ACTIONS = {
    REPLAY_BUFFER: 'Save Replay Buffer',
    SCREENSHOT: 'Take Screenshot',
}

export const SPECIAL_ACTION_OPTIONS = [
    {
        value: OBS_SPECIAL_ACTIONS.SCREENSHOT,
        label: 'Take Screenshot'
    },
    {
        value: OBS_SPECIAL_ACTIONS.REPLAY_BUFFER,
        label: 'Save Replay Buffer'
    }
];

export const OBS_STREAM_STATUS = {
    STARTING: 'starting',
    STARTED: 'started',
    STOPPING: 'stopping',
    STOPPED: 'stopped',
}