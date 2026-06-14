function getUser() {
    // Firebase first (synchronous currentUser after onAuthStateChanged fires)
    if (FIREBASE_ENABLED && typeof firebase !== 'undefined' && firebase.apps?.length) {
        const u = firebase.auth().currentUser;
        if (u) return { name: u.displayName || u.email, email: u.email, uid: u.uid, photoURL: u.photoURL };
    }
    // Fallback: cached user in localStorage
    try { return JSON.parse(localStorage.getItem('sprout_user') || 'null'); } catch { return null; }
}

function handleAvatarTap() {
    const user = getUser();
    if (!user) return;
    if (!confirm(`Signed in as ${user.name}\n${user.email}\n\nSign out?`)) return;

    if (FIREBASE_ENABLED && typeof firebase !== 'undefined' && firebase.apps?.length) {
        firebase.auth().signOut().then(() => {
            localStorage.removeItem('sprout_user');
            currentUid = null;
            window.location.href = 'index.html';
        });
    } else {
        localStorage.removeItem('sprout_user');
        window.location.href = 'index.html';
    }
}
