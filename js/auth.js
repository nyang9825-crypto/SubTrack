function getUser() {
    try { return JSON.parse(localStorage.getItem('sprout_user') || 'null'); } catch { return null; }
}

function requireAuth() {
    if (!getUser()) {
        window.location.href = 'sign-up.html';
        return false;
    }
    return true;
}

function handleAvatarTap() {
    const user = getUser();
    if (!user) return;
    if (confirm(`Signed in as ${user.name}\n\nSign out?`)) {
        localStorage.removeItem('sprout_user');
        window.location.href = 'index.html';
    }
}
