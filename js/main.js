window.addEventListener('load', () => {
    // Auth gate — redirects to sign-up.html if no user
    if (!requireAuth()) return;

    subs      = loadSubs();
    spendings = loadSpendings();

    // Fill avatar + sidebar user info
    const user = getUser();
    if (user) {
        const initial = (user.name?.charAt(0) || 'S').toUpperCase();
        const avatarEl = document.getElementById('homeAvatar');
        if (avatarEl) avatarEl.textContent = initial;
        const nameEl = document.querySelector('.user-badge-name');
        if (nameEl) nameEl.textContent = user.name;
        const tierEl = document.querySelector('.user-badge-tier');
        if (tierEl) tierEl.textContent = user.email;
    }

    // Run each init step independently so one crash doesn't block the rest
    safeRun(setGreeting);
    safeRun(initGmailUI);
    safeRun(renderAll);
    safeRun(renderHomePage);
});

function safeRun(fn) {
    try { fn(); } catch (e) { console.error('[Sprout]', fn.name, e); }
}
