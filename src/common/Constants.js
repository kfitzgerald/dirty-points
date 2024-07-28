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
}