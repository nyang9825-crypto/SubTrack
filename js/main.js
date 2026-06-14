function safeRun(fn) {
    try { fn(); } catch (e) { console.error('[Sprout]', fn.name || fn, e); }
}

function _applyUserUI(user) {
    const initial = (user.name?.charAt(0) || user.email?.[0] || 'S').toUpperCase();
    const avatarEl = document.getElementById('homeAvatar');
    if (avatarEl) avatarEl.textContent = initial;
    const nameEl = document.querySelector('.user-badge-name');
    if (nameEl) nameEl.textContent = user.name || user.email;
    const tierEl = document.querySelector('.user-badge-tier');
    if (tierEl) tierEl.textContent = user.email;
}

function _hideLoader() {
    const el = document.getElementById('appLoader');
    if (el) el.style.display = 'none';
}

function _bootApp(user) {
    _applyUserUI(user);
    subs      = loadSubs();
    spendings = loadSpendings();
    if (typeof loadTrips === 'function') trips = loadTrips();
    _hideLoader();
    safeRun(initGmailUI);
    safeRun(renderAll);
    safeRun(renderHomePage);

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
