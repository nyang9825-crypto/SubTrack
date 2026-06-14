// Storage key helper — all data is namespaced by user UID so
// each account sees only its own data on this device.
function getKey(base) {
    return currentUid ? `sprout_${currentUid}_${base}` : `sprout_${base}`;
}

function persistSubs() {
    localStorage.setItem(getKey('data'), JSON.stringify(subs));
    if (typeof dbSyncSubs === 'function') dbSyncSubs(subs);
}

function loadSubs() {
    const legacy = localStorage.getItem('st_subs_demo');
    if (legacy && !currentUid) {
        localStorage.setItem(getKey('data'), legacy);
        localStorage.removeItem('st_subs_demo');
    }
    return JSON.parse(localStorage.getItem(getKey('data')) || '[]');
}
