const EMOJIS = ['📺','🎵','💻','🎮','📰','🏃','☁️','💰','🛍️','📦','🎬','📱','🔒','📧','🗂️','🎙️','🖥️','📡'];

const CAT_COLORS = {
    'Entertainment':    '#16a34a',
    'Music':            '#0d9488',
    'Software':         '#0284c7',
    'Gaming':           '#7c3aed',
    'News & Reading':   '#65a30d',
    'Health & Fitness': '#059669',
    'Cloud Storage':    '#0891b2',
    'Finance':          '#d97706',
    'Shopping':         '#db2777',
    'Other':            '#6b7280',
};

const KNOWN_SENDERS = {
    'netflix.com':        { name: 'Netflix',               emoji: '📺', cost: 15.49, category: 'Entertainment' },
    'spotify.com':        { name: 'Spotify',               emoji: '🎵', cost: 9.99,  category: 'Music' },
    'amazon.com':         { name: 'Amazon Prime',          emoji: '📦', cost: 14.99, category: 'Shopping' },
    'amazon.co':          { name: 'Amazon Prime',          emoji: '📦', cost: 14.99, category: 'Shopping' },
    'apple.com':          { name: 'Apple One / iCloud',    emoji: '🍎', cost: 9.99,  category: 'Cloud Storage' },
    'google.com':         { name: 'Google One',            emoji: '☁️', cost: 2.99,  category: 'Cloud Storage' },
    'hulu.com':           { name: 'Hulu',                  emoji: '📺', cost: 7.99,  category: 'Entertainment' },
    'disneyplus.com':     { name: 'Disney+',               emoji: '🏰', cost: 13.99, category: 'Entertainment' },
    'max.com':            { name: 'Max (HBO)',              emoji: '📺', cost: 15.99, category: 'Entertainment' },
    'hbo.com':            { name: 'Max (HBO)',              emoji: '📺', cost: 15.99, category: 'Entertainment' },
    'peacocktv.com':      { name: 'Peacock',               emoji: '🦚', cost: 5.99,  category: 'Entertainment' },
    'paramountplus.com':  { name: 'Paramount+',            emoji: '📺', cost: 5.99,  category: 'Entertainment' },
    'crunchyroll.com':    { name: 'Crunchyroll',           emoji: '🎌', cost: 7.99,  category: 'Entertainment' },
    'youtube.com':        { name: 'YouTube Premium',       emoji: '▶️', cost: 13.99, category: 'Entertainment' },
    'twitch.tv':          { name: 'Twitch',                emoji: '🎮', cost: 4.99,  category: 'Gaming' },
    'adobe.com':          { name: 'Adobe Creative Cloud',  emoji: '🎨', cost: 54.99, category: 'Software' },
    'microsoft.com':      { name: 'Microsoft 365',         emoji: '💻', cost: 9.99,  category: 'Software' },
    'dropbox.com':        { name: 'Dropbox',               emoji: '☁️', cost: 9.99,  category: 'Cloud Storage' },
    'github.com':         { name: 'GitHub',                emoji: '🐙', cost: 4.00,  category: 'Software' },
    'notion.so':          { name: 'Notion',                emoji: '📝', cost: 8.00,  category: 'Software' },
    'slack.com':          { name: 'Slack',                 emoji: '💬', cost: 7.25,  category: 'Software' },
    'zoom.us':            { name: 'Zoom',                  emoji: '📹', cost: 14.99, category: 'Software' },
    'canva.com':          { name: 'Canva Pro',             emoji: '🎨', cost: 12.99, category: 'Software' },
    'figma.com':          { name: 'Figma',                 emoji: '🎨', cost: 12.00, category: 'Software' },
    'grammarly.com':      { name: 'Grammarly',             emoji: '✍️', cost: 12.00, category: 'Software' },
    'nordvpn.com':        { name: 'NordVPN',               emoji: '🔒', cost: 3.99,  category: 'Software' },
    'expressvpn.com':     { name: 'ExpressVPN',            emoji: '🔒', cost: 8.32,  category: 'Software' },
    '1password.com':      { name: '1Password',             emoji: '🔑', cost: 2.99,  category: 'Software' },
    'lastpass.com':       { name: 'LastPass',              emoji: '🔑', cost: 3.00,  category: 'Software' },
    'audible.com':        { name: 'Audible',               emoji: '🎧', cost: 14.95, category: 'News & Reading' },
    'nytimes.com':        { name: 'New York Times',        emoji: '📰', cost: 17.00, category: 'News & Reading' },
    'wsj.com':            { name: 'Wall Street Journal',   emoji: '📰', cost: 19.99, category: 'News & Reading' },
    'duolingo.com':       { name: 'Duolingo Plus',         emoji: '🦉', cost: 6.99,  category: 'Health & Fitness' },
    'calm.com':           { name: 'Calm',                  emoji: '🧘', cost: 14.99, category: 'Health & Fitness' },
    'headspace.com':      { name: 'Headspace',             emoji: '🧘', cost: 12.99, category: 'Health & Fitness' },
    'chatgpt.com':        { name: 'ChatGPT Plus',          emoji: '🤖', cost: 20.00, category: 'Software' },
    'openai.com':         { name: 'ChatGPT Plus',          emoji: '🤖', cost: 20.00, category: 'Software' },
    'anthropic.com':      { name: 'Claude Pro',            emoji: '🤖', cost: 20.00, category: 'Software' },
    'patreon.com':        { name: 'Patreon',               emoji: '🎨', cost: 5.00,  category: 'Entertainment' },
    'substack.com':       { name: 'Substack',              emoji: '📧', cost: 5.00,  category: 'News & Reading' },
    'discord.com':        { name: 'Discord Nitro',         emoji: '🎮', cost: 9.99,  category: 'Gaming' },
    'ea.com':             { name: 'EA Play',               emoji: '🎮', cost: 4.99,  category: 'Gaming' },
    'xbox.com':           { name: 'Xbox Game Pass',        emoji: '🎮', cost: 14.99, category: 'Gaming' },
    'playstation.com':    { name: 'PlayStation Plus',      emoji: '🎮', cost: 14.99, category: 'Gaming' },
    'nintendo.com':       { name: 'Nintendo Online',       emoji: '🎮', cost: 3.99,  category: 'Gaming' },
    'midjourney.com':     { name: 'Midjourney',            emoji: '🎨', cost: 10.00, category: 'Software' },
    'cursor.sh':          { name: 'Cursor',                emoji: '💻', cost: 20.00, category: 'Software' },
    'linear.app':         { name: 'Linear',                emoji: '📋', cost: 8.00,  category: 'Software' },
    // Telecom & Internet
    'att.com':            { name: 'AT&T',                  emoji: '📱', cost: 65.00, category: 'Other' },
    'verizon.com':        { name: 'Verizon',               emoji: '📱', cost: 70.00, category: 'Other' },
    't-mobile.com':       { name: 'T-Mobile',              emoji: '📱', cost: 60.00, category: 'Other' },
    'comcast.com':        { name: 'Xfinity / Comcast',     emoji: '📡', cost: 60.00, category: 'Other' },
    'xfinity.com':        { name: 'Xfinity / Comcast',     emoji: '📡', cost: 60.00, category: 'Other' },
    'spectrum.com':       { name: 'Spectrum',              emoji: '📡', cost: 50.00, category: 'Other' },
    'cox.com':            { name: 'Cox',                   emoji: '📡', cost: 55.00, category: 'Other' },
    // Insurance
    'geico.com':          { name: 'GEICO',                 emoji: '🛡️', cost: 120.00, category: 'Finance' },
    'progressive.com':    { name: 'Progressive',           emoji: '🛡️', cost: 110.00, category: 'Finance' },
    'statefarm.com':      { name: 'State Farm',            emoji: '🛡️', cost: 130.00, category: 'Finance' },
    'allstate.com':       { name: 'Allstate',              emoji: '🛡️', cost: 125.00, category: 'Finance' },
    // Finance & payments
    'paypal.com':         { name: 'PayPal',                emoji: '💳', cost: 0.00,  category: 'Finance' },
    'chase.com':          { name: 'Chase',                 emoji: '🏦', cost: 0.00,  category: 'Finance' },
    'bankofamerica.com':  { name: 'Bank of America',       emoji: '🏦', cost: 0.00,  category: 'Finance' },
    // Fitness
    'peloton.com':        { name: 'Peloton',               emoji: '🚴', cost: 44.00, category: 'Health & Fitness' },
    'strava.com':         { name: 'Strava',                emoji: '🏃', cost: 7.99,  category: 'Health & Fitness' },
    'myfitnesspal.com':   { name: 'MyFitnessPal',          emoji: '🏋️', cost: 9.99,  category: 'Health & Fitness' },
    // Productivity & dev
    'atlassian.com':      { name: 'Atlassian / Jira',      emoji: '📋', cost: 8.15,  category: 'Software' },
    'jetbrains.com':      { name: 'JetBrains',             emoji: '💻', cost: 24.90, category: 'Software' },
    'netlify.com':        { name: 'Netlify',               emoji: '☁️', cost: 19.00, category: 'Software' },
    'vercel.com':         { name: 'Vercel',                emoji: '☁️', cost: 20.00, category: 'Software' },
    'heroku.com':         { name: 'Heroku',                emoji: '☁️', cost: 7.00,  category: 'Software' },
    'digitalocean.com':   { name: 'DigitalOcean',          emoji: '☁️', cost: 6.00,  category: 'Software' },
    'aws.amazon.com':     { name: 'AWS',                   emoji: '☁️', cost: 20.00, category: 'Cloud Storage' },
    'cloud.google.com':   { name: 'Google Cloud',          emoji: '☁️', cost: 10.00, category: 'Cloud Storage' },
    'azure.com':          { name: 'Microsoft Azure',       emoji: '☁️', cost: 20.00, category: 'Cloud Storage' },
};

// name → Google favicon URL at 64px (first matching domain wins for duplicates)
const BRAND_LOGOS = {};
Object.entries(KNOWN_SENDERS).forEach(([domain, svc]) => {
    if (!BRAND_LOGOS[svc.name]) {
        BRAND_LOGOS[svc.name] = 'https://www.google.com/s2/favicons?domain=' + domain + '&sz=64';
    }
});

// Deduplicated, alphabetically sorted catalog for Quick Add modal (includes logo)
const SERVICE_CATALOG = (function () {
    const seen = new Set();
    return Object.entries(KNOWN_SENDERS)
        .filter(([, s]) => { if (seen.has(s.name)) return false; seen.add(s.name); return true; })
        .map(([domain, s]) => ({ ...s, logo: 'https://www.google.com/s2/favicons?domain=' + domain + '&sz=64' }))
        .sort((a, b) => a.name.localeCompare(b.name));
})();

const BILLING_KEYWORDS = [
    'receipt', 'invoice', 'billing', 'subscription', 'renewal',
    'payment confirmation', 'order confirmation', 'your order',
    'membership', 'plan', 'charge', 'statement',
    'your bill', 'monthly bill', 'payment received', 'payment processed',
    'autopay', 'auto-pay', 'automatic payment', 'transaction confirmation',
    'payment due', 'amount due', 'your statement', 'your receipt',
    'successfully charged', 'thank you for your payment', 'payment successful',
];
