const AVATAR_EMOJIS = [
    '🌱','🌿','🍀','🌸','🌺','🌻','🌼','🌵',
    '🐱','🐶','🐰','🦊','🐻','🐼','🐨','🦋',
    '🦄','🌙','⭐','🎀','🍓','🥑','🌈','💚',
];

function getUser() {
    if (FIREBASE_ENABLED && typeof firebase !== 'undefined' && firebase.apps?.length) {
        const u = firebase.auth().currentUser;
        if (u) return { name: u.displayName || u.email, email: u.email, uid: u.uid, photoURL: u.photoURL };
    }
    try { return JSON.parse(localStorage.getItem('sprout_user') || 'null'); } catch { return null; }
}

function _storedPhoto(uid) {
    try { return localStorage.getItem(`sprout_photo_${uid}`) || null; } catch { return null; }
}

function _savePhoto(uid, dataUrl) {
    try { localStorage.setItem(`sprout_photo_${uid}`, dataUrl); } catch {}
}

function renderAllAvatars() {
    const user = getUser();
    if (!user) return;
    const stored  = _storedPhoto(user.uid);
    const initial = (user.name?.[0] || user.email?.[0] || 'S').toUpperCase();

    const applyAvatar = el => {
        if (!el) return;
        const isDataUrl = stored && stored.startsWith('data:');
        const isEmoji   = stored && !isDataUrl;
        if (isDataUrl) {
            el.style.backgroundImage    = `url('${stored}')`;
            el.style.backgroundSize     = 'cover';
            el.style.backgroundPosition = 'center';
            el.style.fontSize           = '';
            el.textContent = '';
        } else if (isEmoji) {
            el.style.backgroundImage = '';
            el.style.backgroundSize  = '';
            el.style.backgroundPosition = '';
            el.style.fontSize        = '38px';
            el.textContent = stored;
        } else {
            // fallback: Google photo or initial
            const photo = user.photoURL || null;
            if (photo) {
                el.style.backgroundImage    = `url('${photo}')`;
                el.style.backgroundSize     = 'cover';
                el.style.backgroundPosition = 'center';
                el.style.fontSize           = '';
                el.textContent = '';
            } else {
                el.style.backgroundImage    = '';
                el.style.backgroundSize     = '';
                el.style.backgroundPosition = '';
                el.style.fontSize           = '';
                el.textContent = initial;
            }
        }
    };

    applyAvatar(document.getElementById('homeAvatar'));
    applyAvatar(document.getElementById('sidebarAvatar'));
    applyAvatar(document.getElementById('profileAvatarLg'));
}

// ── Avatar emoji picker ────────────────────────────────────────────────
function _buildAvatarGrid() {
    const grid = document.getElementById('avatarPickerGrid');
    if (!grid) return;
    const user    = getUser();
    const current = user ? _storedPhoto(user.uid) : null;
    grid.innerHTML = AVATAR_EMOJIS.map(e => {
        const sel = e === current;
        return `<button class="avatar-opt" data-emoji="${e}" onclick="selectAvatar('${e}')"
            title="${e}"
            style="width:42px;height:42px;border-radius:50%;border:2.5px solid ${sel ? 'var(--primary)' : '#e5e7eb'};background:${sel ? '#f0fdf4' : '#f9fafb'};font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:border-color 0.15s,background 0.15s;flex-shrink:0;outline:none"
            onmouseover="this.style.borderColor='var(--primary)';this.style.background='#f0fdf4'"
            onmouseout="this.dataset.emoji==='${current}'||(this.style.borderColor='#e5e7eb',this.style.background='#f9fafb')"
        >${e}</button>`;
    }).join('');
}

function selectAvatar(emoji) {
    const user = getUser();
    if (!user?.uid) return;
    _savePhoto(user.uid, emoji);
    renderAllAvatars();
    // update ring on grid
    document.querySelectorAll('.avatar-opt').forEach(btn => {
        const sel = btn.dataset.emoji === emoji;
        btn.style.borderColor = sel ? 'var(--primary)' : '#e5e7eb';
        btn.style.background  = sel ? '#f0fdf4' : '#f9fafb';
    });
}

// ── Profile modal ──────────────────────────────────────────────────────
function openProfile() {
    const user = getUser();
    if (!user) return;
    document.getElementById('profileName').textContent  = user.name  || '—';
    document.getElementById('profileEmail').textContent = user.email || '—';
    renderAllAvatars();
    _buildAvatarGrid();
    document.getElementById('profileBackdrop').classList.remove('hidden');
}

function closeProfile() {
    document.getElementById('profileBackdrop').classList.add('hidden');
}

function handleAvatarTap() { openProfile(); }

// ── Photo upload ───────────────────────────────────────────────────────
function triggerPhotoUpload() {
    document.getElementById('profilePhotoInput').click();
}

function handlePhotoUpload(input) {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        const img = new Image();
        img.onload = () => {
            const MAX    = 220;
            const scale  = Math.min(MAX / img.width, MAX / img.height, 1);
            const canvas = document.createElement('canvas');
            canvas.width  = Math.round(img.width  * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
            const user = getUser();
            if (user?.uid) {
                _savePhoto(user.uid, dataUrl);
                renderAllAvatars();
                _buildAvatarGrid();
                toast('Profile photo updated!');
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    input.value = '';
}

// ── Sign out ───────────────────────────────────────────────────────────
function signOut() {
    closeProfile();
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
