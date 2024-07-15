export const DEFAULT_PREFERENCES = {
};

// Auth: see https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#implicit-grant-flow
// Scopes we need:
export const REQUIRED_SCOPES = [
    'channel:manage:redemptions',       // so we can list/enable/disable redemptions
    'user:read:chat',
];