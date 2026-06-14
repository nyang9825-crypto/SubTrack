window.addEventListener('load', () => {
    if (!requireAuth()) return;

    subs      = loadSubs();
    spendings = loadSpendings();

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

    setGreeting();
    initGmailUI();
    renderAll();
    renderBudgetWidget();
    renderHomePage();
});
