// Firestore data layer — fire-and-forget writes, async reads on login
// All functions no-op gracefully when Firebase is not configured.

let _db  = null;
let _uid = null;

function dbInit(db, uid) { _db = db; _uid = uid; }

function _userDataRef(doc) {
    if (!_db || !_uid) return null;
    return _db.collection('users').doc(_uid).collection('data').doc(doc);
}

async function dbLoadUserData() {
    if (!_db || !_uid) return null;
    try {
        const [s, sp, st, tr] = await Promise.all([
            _userDataRef('subs').get(),
            _userDataRef('spendings').get(),
            _userDataRef('settings').get(),
            _userDataRef('trips').get(),
        ]);
        return {
            subs:      s.exists  ? (s.data().items  || []) : null,
            spendings: sp.exists ? (sp.data().items || []) : null,
            settings:  st.exists ? st.data()                : null,
            trips:     tr.exists ? (tr.data().items || []) : null,
        };
    } catch (e) {
        console.error('[db] load error:', e);
        return null;
    }
}

function dbSyncSubs(items) {
    const ref = _userDataRef('subs');
    if (!ref) return;
    ref.set({ items, updatedAt: new Date().toISOString() }).catch(console.error);
}

function dbSyncSpendings(items) {
    const ref = _userDataRef('spendings');
    if (!ref) return;
    // Strip receipt thumbnails — too large for Firestore (kept only in localStorage)
    const stripped = items.map(({ receiptThumb, ...rest }) => rest);
    ref.set({ items: stripped, updatedAt: new Date().toISOString() }).catch(console.error);
}

function dbSyncSettings(settings) {
    const ref = _userDataRef('settings');
    if (!ref) return;
    ref.set({ ...settings, updatedAt: new Date().toISOString() }).catch(console.error);
}

function dbSyncTrips(items) {
    const ref = _userDataRef('trips');
    if (!ref) return;
    const stripped = items.map(({ expenses, ...t }) => ({
        ...t, expenses: (expenses || []).map(({ receiptThumb, ...e }) => e),
    }));
    ref.set({ items: stripped, updatedAt: new Date().toISOString() }).catch(console.error);
}

async function dbSetSharedTrip(shareCode, tripData) {
    if (!_db) return;
    try {
        await _db.collection('shared_trips').doc(shareCode).set({
            ...tripData, updatedAt: new Date().toISOString(),
        });
    } catch (e) { console.error('[db] share trip error:', e); }
}

async function dbGetSharedTrip(shareCode) {
    if (!_db) return null;
    try {
        const snap = await _db.collection('shared_trips').doc(shareCode).get();
        return snap.exists ? snap.data() : null;
    } catch (e) { console.error('[db] get shared trip error:', e); return null; }
}

async function dbSaveProfile(user) {
    if (!_db || !_uid) return;
    try {
        await _db.collection('users').doc(_uid).set({
            name:      user.displayName || user.email,
            email:     user.email,
            photoURL:  user.photoURL || null,
            lastLogin: new Date().toISOString(),
        }, { merge: true });
    } catch (e) {
        console.error('[db] profile error:', e);
    }
}
