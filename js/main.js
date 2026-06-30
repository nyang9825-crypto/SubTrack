function safeRun(fn) {
    try { fn(); } catch (e) { console.error('[Sprout]', fn.name || fn, e); }
}

function _applyUserUI(user) {
    const nameEl = document.querySelector('.user-badge-name');
    if (nameEl) nameEl.textContent = user.name || user.email;
    const tierEl = document.querySelector('.user-badge-tier');
    if (tierEl) tierEl.textContent = user.email;
    setTimeout(() => { if (typeof renderAllAvatars === 'function') renderAllAvatars(); }, 50);
}

function _hideLoader() {
    const el = document.getElementById('appLoader');
    if (el) el.style.display = 'none';
}

function applyTheme(theme) {
    const next = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('sprout_theme', next);

    const isDark = next === 'dark';
    [
        ['themeToggleIcon', isDark ? '☀' : '☾'],
        ['profileThemeToggleIcon', isDark ? '☀' : '☾'],
        ['themeToggleLabel', isDark ? 'Light mode' : 'Dark mode'],
        ['profileThemeToggleLabel', isDark ? 'Light mode' : 'Dark mode'],
    ].forEach(([id, text]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    });
}

function toggleTheme() {
    const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
}

function initTheme() {
    const stored = localStorage.getItem('sprout_theme');
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    applyTheme(stored || (prefersDark ? 'dark' : 'light'));
}

function initUxPolish() {
    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        document.querySelectorAll('.modal-backdrop:not(.hidden)').forEach(backdrop => {
            const closeBtn = backdrop.querySelector('.close-btn');
            if (closeBtn) closeBtn.click();
        });
    });

    document.addEventListener('pointerdown', e => {
        const target = e.target.closest('button, .sub-grid-card, .catalog-tile, .cat-quick-btn');
        if (!target) return;
        target.classList.remove('is-pressing');
        void target.offsetWidth;
        target.classList.add('is-pressing');
        setTimeout(() => target.classList.remove('is-pressing'), 220);
    });
}

function _maybeShowA2hs() {
    const isIOS        = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.navigator.standalone === true;
    const dismissed    = localStorage.getItem('sprout_a2hs_dismissed');
    if (!isIOS || isStandalone || dismissed) return;
    setTimeout(() => {
        const banner = document.getElementById('a2hsBanner');
        if (banner) {
            banner.style.display = '';
            banner.style.transform = 'translateY(100%)';
            banner.style.opacity = '0';
            banner.style.transition = 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease';
            requestAnimationFrame(() => requestAnimationFrame(() => {
                banner.style.transform = '';
                banner.style.opacity = '1';
            }));
        }
    }, 5000);
}

function dismissA2hs() {
    localStorage.setItem('sprout_a2hs_dismissed', '1');
    const banner = document.getElementById('a2hsBanner');
    if (!banner) return;
    banner.style.transition = 'transform 0.3s ease, opacity 0.25s ease';
    banner.style.transform  = 'translateY(100%)';
    banner.style.opacity    = '0';
    setTimeout(() => { banner.style.display = 'none'; }, 350);
}

function _bootApp(user) {
    initTheme();
    _applyUserUI(user);
    subs      = loadSubs();
    spendings = loadSpendings();
    if (typeof loadTrips === 'function') trips = loadTrips();
    _hideLoader();
    safeRun(initGmailUI);
    safeRun(renderAll);
    safeRun(renderHomePage);
    safeRun(initUxPolish);
    _maybeShowA2hs();

    // Swipe-down close for sheet modals
    setTimeout(() => {
        const pairs = [
            ['quick-add-sheet',   closeQuickAdd],
            ['spendSheet',        closeSpendModal],
            ['createTripBackdrop', closeCreateTrip],
            ['tripExpenseBackdrop', closeTripExpenseModal],
        ];
        pairs.forEach(([id, fn]) => {
            const el = document.getElementById(id) || document.querySelector(`.${id}`);
            if (el && typeof fn === 'function') addSwipeClose(el, fn);
        });
    }, 200);

    // Init cash-register currency inputs
    setTimeout(() => {
        ['qaAmount', 'spendAmount', 'teAmount', 'fCost'].forEach(id => {
            const el = document.getElementById(id);
            if (el) setupCurrencyInput(el);
        });
    }, 300);

    // Handle trip invite link (?joinTrip=SHARECODE)
    const _joinCode = new URLSearchParams(window.location.search).get('joinTrip');
    if (_joinCode) {
        history.replaceState({}, '', window.location.pathname);
        setTimeout(() => { if (typeof joinTripByCode === 'function') joinTripByCode(_joinCode); }, 600);
    }
}

// ── Firebase path ──────────────────────────────────────────────────────
if (FIREBASE_ENABLED && typeof firebase !== 'undefined' && firebase.apps?.length) {

    firebase.auth().onAuthStateChanged(async (firebaseUser) => {
        if (!firebaseUser) {
            const _p = new URLSearchParams(window.location.search).get('joinTrip');
            window.location.href = 'sign-up.html' + (_p ? '?joinTrip=' + encodeURIComponent(_p) : '');
            return;
        }

        // Set global UID so getKey() namespaces all localStorage to this user
        currentUid = firebaseUser.uid;

        // Initialize Firestore layer
        dbInit(firebase.firestore(), currentUid);

        // Save/update profile
        dbSaveProfile(firebaseUser);

        // Pull cloud data and seed localStorage for this UID
        const cloud = await dbLoadUserData();
        if (cloud) {
            if (cloud.subs)      localStorage.setItem(getKey('data'),        JSON.stringify(cloud.subs));
            if (cloud.spendings) localStorage.setItem(getKey('spendings'),   JSON.stringify(cloud.spendings));
            if (cloud.trips)     localStorage.setItem(getKey('trips'),       JSON.stringify(cloud.trips));
            if (cloud.settings?.monthly  != null) localStorage.setItem(getKey('budget'),     JSON.stringify({ monthly: cloud.settings.monthly }));
            if (cloud.settings?.catBudgets)        localStorage.setItem(getKey('cat_budgets'), JSON.stringify(cloud.settings.catBudgets));
        }

        const user = {
            name:     firebaseUser.displayName || firebaseUser.email,
            email:    firebaseUser.email,
            uid:      firebaseUser.uid,
            photoURL: firebaseUser.photoURL,
        };
        localStorage.setItem('sprout_user', JSON.stringify(user));

        _bootApp(user);
    });

// ── Legacy localStorage path (Firebase not yet configured) ─────────────
} else {
    window.addEventListener('load', () => {
        const user = (() => { try { return JSON.parse(localStorage.getItem('sprout_user') || 'null'); } catch { return null; } })();
        if (!user) { window.location.href = 'sign-up.html'; return; }
        _bootApp(user);
    });
}
