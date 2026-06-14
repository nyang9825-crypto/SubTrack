// ── Trips & Events ────────────────────────────────────────────────────
let trips = [];
let activeTripId = null;
let tripTab = 'expenses';
let tripExpenseEditId = null;
let selectedTeCat = 'Food & Dining';
let createTripMembers = [];
let createTripEditId = null;
let createTripSelectedEmoji = '✈️';

const TRIP_EMOJIS = ['✈️','🏖️','🎉','🎂','🏔️','🎭','🍽️','🏕️','🚗','🎮','🏋️','🛳️','🌴','🎪','🎵'];

function loadTrips() {
    try { return JSON.parse(localStorage.getItem(getKey('trips')) || '[]'); } catch { return []; }
}

function saveTrips() {
    localStorage.setItem(getKey('trips'), JSON.stringify(trips));
    if (typeof dbSyncTrips === 'function') dbSyncTrips(trips);
}

function getActiveTrip() {
    return trips.find(t => t.id === activeTripId) || null;
}

function genShareCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function fmtTripDate(dateStr) {
    if (!dateStr) return '';
    try {
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch { return dateStr; }
}

// ── Trips list page ───────────────────────────────────────────────────
function renderTripsPage() {
    const listEl   = document.getElementById('tripListView');
    const detailEl = document.getElementById('tripDetailView');
    if (!listEl || !detailEl) return;

    if (activeTripId) {
        listEl.style.display   = 'none';
        detailEl.style.display = '';
        renderTripDetail();
        return;
    }
    listEl.style.display   = '';
    detailEl.style.display = 'none';

    if (!trips.length) {
        listEl.innerHTML = `
            <div style="text-align:center;padding:60px 20px 20px">
                <div style="font-size:60px;margin-bottom:16px">✈️</div>
                <div style="font-size:20px;font-weight:800;color:var(--text);margin-bottom:8px">No trips yet</div>
                <div style="font-size:14px;color:var(--muted);margin-bottom:28px;line-height:1.6">
                    Create a trip or event to track<br>shared expenses and split costs easily.
                </div>
                <button onclick="openCreateTrip()"
                    style="padding:14px 28px;background:linear-gradient(135deg,var(--primary),var(--teal));color:white;border:none;border-radius:14px;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;box-shadow:0 6px 20px rgba(22,163,74,0.35)">
                    + Create Trip or Event
                </button>
            </div>`;
        return;
    }

    listEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
            <div style="font-size:13px;color:var(--muted);font-weight:600">${trips.length} trip${trips.length !== 1 ? 's' : ''}</div>
            <button onclick="openCreateTrip()"
                style="padding:8px 18px;background:var(--primary);color:white;border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
                + New Trip
            </button>
        </div>
        ${[...trips].reverse().map(trip => {
            const total      = (trip.expenses || []).reduce((s, e) => s + e.amount, 0);
            const expCount   = (trip.expenses || []).length;
            const memCount   = (trip.members  || []).length;
            const start      = fmtTripDate(trip.startDate);
            const end        = trip.endDate && trip.endDate !== trip.startDate ? fmtTripDate(trip.endDate) : '';
            const dateStr    = start ? (end ? `${start} – ${end}` : start) : '';
            return `
            <div onclick="openTripDetail('${trip.id}')" style="background:white;border:1px solid var(--border-soft);border-radius:18px;padding:18px 20px;margin-bottom:14px;cursor:pointer;transition:box-shadow 0.15s"
                onmouseover="this.style.boxShadow='0 4px 20px rgba(22,163,74,0.12)'"
                onmouseout="this.style.boxShadow=''">
                <div style="display:flex;align-items:center;gap:14px">
                    <div style="width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0">${trip.emoji || '✈️'}</div>
                    <div style="flex:1;min-width:0">
                        <div style="font-size:16px;font-weight:800;color:var(--text)">${escHtml(trip.name)}</div>
                        <div style="font-size:12px;color:var(--muted);margin-top:3px">${[dateStr, memCount ? `${memCount} member${memCount !== 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ')}</div>
                    </div>
                    <div style="text-align:right;flex-shrink:0">
                        <div style="font-size:18px;font-weight:800;color:var(--text)">$${total.toFixed(0)}</div>
                        <div style="font-size:11px;color:var(--muted);margin-top:2px">${expCount} expense${expCount !== 1 ? 's' : ''}</div>
                    </div>
                </div>
            </div>`;
        }).join('')}
    `;
}

// ── Trip detail ───────────────────────────────────────────────────────
function openTripDetail(id) {
    activeTripId = id;
    tripTab = 'expenses';
    renderTripsPage();
}

function closeTripDetail() {
    activeTripId = null;
    renderTripsPage();
}

function renderTripDetail() {
    const el = document.getElementById('tripDetailView');
    if (!el) return;
    const trip = getActiveTrip();
    if (!trip) { closeTripDetail(); return; }

    const total  = (trip.expenses || []).reduce((s, e) => s + e.amount, 0);
    const start  = fmtTripDate(trip.startDate);
    const end    = trip.endDate && trip.endDate !== trip.startDate ? fmtTripDate(trip.endDate) : '';
    const dateStr = start ? (end ? `${start} – ${end}` : start) : '';

    el.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
            <button onclick="closeTripDetail()"
                style="width:36px;height:36px;border-radius:10px;border:1.5px solid var(--border);background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;color:var(--text)">‹</button>
            <div style="flex:1;min-width:0">
                <div style="font-size:19px;font-weight:800;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${trip.emoji || '✈️'} ${escHtml(trip.name)}</div>
                ${dateStr ? `<div style="font-size:12px;color:var(--muted);margin-top:2px">${dateStr}</div>` : ''}
            </div>
            <button onclick="shareTripLink('${trip.id}')" title="Share"
                style="width:36px;height:36px;border-radius:10px;border:1.5px solid var(--border);background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" stroke-width="2.2" stroke-linecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </button>
            <button onclick="openCreateTrip('${trip.id}')" title="Edit"
                style="width:36px;height:36px;border-radius:10px;border:1.5px solid var(--border);background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
        </div>

        <div style="background:linear-gradient(135deg,#052e16,#14532d);border-radius:18px;padding:20px 22px;margin-bottom:18px;color:white">
            <div style="font-size:11px;opacity:0.65;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Total trip expenses</div>
            <div style="font-size:36px;font-weight:800;letter-spacing:-1.5px;line-height:1">$${total.toFixed(2)}</div>
            ${trip.members?.length ? `
            <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:6px">
                ${trip.members.map(m => `<span style="padding:4px 10px;background:rgba(255,255,255,0.15);border-radius:99px;font-size:12px;font-weight:600">${escHtml(m.name)}</span>`).join('')}
            </div>` : ''}
        </div>

        <div style="display:flex;background:#f0fdf4;border-radius:12px;padding:4px;gap:4px;margin-bottom:18px">
            <button id="tripTabExpBtn" onclick="setTripTab('expenses')"
                style="flex:1;padding:9px;border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.15s;background:${tripTab==='expenses'?'white':'transparent'};color:${tripTab==='expenses'?'var(--text)':'var(--muted)'};box-shadow:${tripTab==='expenses'?'0 1px 6px rgba(0,0,0,0.1)':'none'}">
                Expenses
            </button>
            <button id="tripTabSplitBtn" onclick="setTripTab('split')"
                style="flex:1;padding:9px;border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.15s;background:${tripTab==='split'?'white':'transparent'};color:${tripTab==='split'?'var(--text)':'var(--muted)'};box-shadow:${tripTab==='split'?'0 1px 6px rgba(0,0,0,0.1)':'none'}">
                Split
            </button>
        </div>

        <div id="tripTabContent"></div>

        <button onclick="openTripExpenseModal()"
            style="position:fixed;bottom:88px;right:20px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--teal));color:white;border:none;font-size:26px;cursor:pointer;box-shadow:0 6px 24px rgba(22,163,74,0.45);z-index:50;display:flex;align-items:center;justify-content:center;transition:transform 0.15s"
            onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform=''">+</button>
    `;

    renderTripTabContent();
}

function setTripTab(tab) {
    tripTab = tab;
    const expBtn   = document.getElementById('tripTabExpBtn');
    const splitBtn = document.getElementById('tripTabSplitBtn');
    [expBtn, splitBtn].forEach((btn, i) => {
        if (!btn) return;
        const active = (i === 0 && tab === 'expenses') || (i === 1 && tab === 'split');
        btn.style.background  = active ? 'white' : 'transparent';
        btn.style.color       = active ? 'var(--text)' : 'var(--muted)';
        btn.style.boxShadow   = active ? '0 1px 6px rgba(0,0,0,0.1)' : 'none';
    });
    renderTripTabContent();
}

function renderTripTabContent() {
    const el = document.getElementById('tripTabContent');
    if (!el) return;
    tripTab === 'expenses' ? renderTripExpenses(el) : renderTripSplit(el);
}

function renderTripExpenses(el) {
    const trip = getActiveTrip();
    if (!trip) return;
    const expenses  = [...(trip.expenses || [])].sort((a, b) => b.date.localeCompare(a.date));
    const memberMap = {};
    (trip.members || []).forEach(m => { memberMap[m.id] = m.name; });

    if (!expenses.length) {
        el.innerHTML = `<div style="text-align:center;padding:40px 20px">
            <div style="font-size:40px;margin-bottom:12px">💸</div>
            <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:6px">No expenses yet</div>
            <div style="font-size:13px;color:var(--muted)">Tap + to log the first expense</div>
        </div>`;
        return;
    }

    el.innerHTML = `<div style="background:white;border-radius:16px;border:1px solid var(--border-soft);overflow:hidden;margin-bottom:80px">
        ${expenses.map((exp, i) => {
            const c        = SPEND_CATS.find(x => x.name === exp.category) || SPEND_CATS[7];
            const paidName = memberMap[exp.paidBy] || '?';
            const count    = exp.splitBetween?.length || 1;
            const per      = (exp.amount / count).toFixed(2);
            return `<div style="display:flex;align-items:center;gap:12px;padding:14px 16px;${i<expenses.length-1?'border-bottom:1px solid #f0fdf4':''}">
                <div style="width:40px;height:40px;border-radius:11px;background:${c.color}18;display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0">${c.emoji}</div>
                <div style="flex:1;min-width:0">
                    <div style="font-size:14px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(exp.name)}</div>
                    <div style="font-size:11px;color:var(--muted);margin-top:2px">${fmtTripDate(exp.date)} · Paid by ${escHtml(paidName)}</div>
                    <div style="font-size:11px;color:var(--muted)">$${per}/person · ${count} ${count===1?'person':'people'}</div>
                </div>
                <div style="font-size:15px;font-weight:800;color:var(--text);white-space:nowrap;text-align:right;min-width:54px">$${exp.amount.toFixed(2)}</div>
                <div style="display:flex;flex-direction:column;gap:2px;flex-shrink:0">
                    <button onclick="openTripExpenseModal(${exp.id})" style="padding:4px 5px;border:none;background:none;cursor:pointer;color:#9ca3af;line-height:1" title="Edit">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onclick="deleteTripExpense(${exp.id})" style="padding:4px 5px;border:none;background:none;cursor:pointer;color:#d1d5db;line-height:1" title="Delete">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
            </div>`;
        }).join('')}
    </div>`;
}

function renderTripSplit(el) {
    const trip = getActiveTrip();
    if (!trip?.members?.length) {
        el.innerHTML = `<div style="text-align:center;padding:30px;color:var(--muted);font-size:14px">Add members to see the split</div>`;
        return;
    }

    const memberMap = {};
    trip.members.forEach(m => { memberMap[m.id] = m.name; });

    // Calculate balances
    const balances = {};
    trip.members.forEach(m => { balances[m.id] = 0; });
    (trip.expenses || []).forEach(exp => {
        if (!exp.splitBetween?.length) return;
        const per = exp.amount / exp.splitBetween.length;
        balances[exp.paidBy] = (balances[exp.paidBy] || 0) + exp.amount;
        exp.splitBetween.forEach(mid => { balances[mid] = (balances[mid] || 0) - per; });
    });

    // Greedy settlement
    const cp = Object.entries(balances).filter(([,b]) => b > 0.01).map(([id,b]) => ({id,b})).sort((a,c)=>c.b-a.b);
    const cn = Object.entries(balances).filter(([,b]) => b < -0.01).map(([id,b]) => ({id,b:-b})).sort((a,c)=>c.b-a.b);
    const txns = [];
    let ii = 0, jj = 0;
    const cpc = cp.map(x=>({...x})), cnc = cn.map(x=>({...x}));
    while (ii < cpc.length && jj < cnc.length) {
        const amt = Math.min(cpc[ii].b, cnc[jj].b);
        if (amt > 0.005) txns.push({ from: cnc[jj].id, to: cpc[ii].id, amount: amt });
        cpc[ii].b -= amt; cnc[jj].b -= amt;
        if (cpc[ii].b < 0.005) ii++;
        if (cnc[jj].b < 0.005) jj++;
    }

    const total     = (trip.expenses || []).reduce((s, e) => s + e.amount, 0);
    const perPerson = trip.members.length ? total / trip.members.length : 0;

    el.innerHTML = `
        <div style="background:white;border:1px solid var(--border-soft);border-radius:16px;overflow:hidden;margin-bottom:14px">
            <div style="padding:14px 18px;border-bottom:1px solid #f0fdf4;display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:13px;font-weight:700;color:var(--text)">Balance per person</span>
                <span style="font-size:12px;color:var(--muted)">$${perPerson.toFixed(2)} avg</span>
            </div>
            ${trip.members.map(m => {
                const b = Math.round((balances[m.id] || 0) * 100) / 100;
                const color = b > 0.01 ? '#16a34a' : b < -0.01 ? '#ef4444' : '#6b7280';
                const label = b > 0.01 ? `gets back $${b.toFixed(2)}` : b < -0.01 ? `owes $${Math.abs(b).toFixed(2)}` : 'settled ✓';
                return `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 18px;border-bottom:1px solid #f0fdf4">
                    <div style="display:flex;align-items:center;gap:10px">
                        <div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#22c55e,#15803d);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:700;flex-shrink:0">${m.name[0]?.toUpperCase()}</div>
                        <span style="font-size:14px;font-weight:600;color:var(--text)">${escHtml(m.name)}</span>
                    </div>
                    <span style="font-size:13px;font-weight:700;color:${color}">${label}</span>
                </div>`;
            }).join('')}
        </div>

        <div style="background:white;border:1px solid var(--border-soft);border-radius:16px;overflow:hidden;margin-bottom:80px">
            <div style="padding:14px 18px;border-bottom:1px solid #f0fdf4;font-size:13px;font-weight:700;color:var(--text)">How to settle up 💸</div>
            ${txns.length ? txns.map(tx => `
                <div style="display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid #f0fdf4">
                    <div style="width:36px;height:36px;border-radius:10px;background:#fef2f2;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0">💸</div>
                    <div style="flex:1">
                        <div style="font-size:14px;font-weight:700;color:var(--text)">
                            <span style="color:#ef4444">${escHtml(memberMap[tx.from] || tx.from)}</span>
                            &nbsp;→&nbsp;
                            <span style="color:#16a34a">${escHtml(memberMap[tx.to] || tx.to)}</span>
                        </div>
                    </div>
                    <div style="font-size:16px;font-weight:800;color:var(--text)">$${tx.amount.toFixed(2)}</div>
                </div>
            `).join('') : `<div style="padding:24px;text-align:center;color:var(--muted);font-size:13px">✅ Everyone is settled up!</div>`}
        </div>
    `;
}

// ── Create / Edit Trip modal ──────────────────────────────────────────
function openCreateTrip(tripId = null) {
    createTripEditId = tripId || null;
    const trip = tripId ? trips.find(t => t.id === tripId) : null;
    createTripMembers      = trip ? JSON.parse(JSON.stringify(trip.members || [])) : [];
    createTripSelectedEmoji = trip?.emoji || '✈️';

    document.getElementById('ctModalTitle').textContent = tripId ? 'Edit Trip' : 'New Trip';
    document.getElementById('ctTripName').value  = trip?.name      || '';
    document.getElementById('ctStartDate').value = trip?.startDate || '';
    document.getElementById('ctEndDate').value   = trip?.endDate   || '';
    document.getElementById('ctTripEmoji').textContent = createTripSelectedEmoji;
    renderCtEmojis();
    renderCtMembers();
    document.getElementById('createTripBackdrop').classList.remove('hidden');
    setTimeout(() => document.getElementById('ctTripName').focus(), 60);
}

function closeCreateTrip() {
    document.getElementById('createTripBackdrop').classList.add('hidden');
}

function renderCtEmojis() {
    const el = document.getElementById('ctEmojiPicker');
    if (!el) return;
    el.innerHTML = TRIP_EMOJIS.map(e => `
        <button onclick="selectTripEmoji('${e}')"
            style="width:40px;height:40px;border-radius:10px;border:2px solid ${e===createTripSelectedEmoji?'var(--primary)':'transparent'};background:${e===createTripSelectedEmoji?'#f0fdf4':'#f8fafc'};font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.12s">${e}
        </button>`).join('');
}

function selectTripEmoji(e) {
    createTripSelectedEmoji = e;
    document.getElementById('ctTripEmoji').textContent = e;
    renderCtEmojis();
}

function renderCtMembers() {
    const el = document.getElementById('ctMemberList');
    if (!el) return;
    if (!createTripMembers.length) {
        el.innerHTML = `<div style="font-size:12px;color:var(--muted);padding:8px 0">Add people to split expenses with</div>`;
        return;
    }
    el.innerHTML = createTripMembers.map((m, i) => `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f0fdf4">
            <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#22c55e,#15803d);display:flex;align-items:center;justify-content:center;color:white;font-size:13px;font-weight:700;flex-shrink:0">${(m.name[0]||'?').toUpperCase()}</div>
            <span style="flex:1;font-size:14px;font-weight:600;color:var(--text)">${escHtml(m.name)}</span>
            <button onclick="removeCtMember(${i})" style="padding:4px 8px;border:none;background:none;cursor:pointer;color:#d1d5db;font-size:16px;line-height:1">✕</button>
        </div>`).join('');
}

function addCtMember() {
    const input = document.getElementById('ctMemberName');
    const name  = input.value.trim();
    if (!name) return;
    if (createTripMembers.some(m => m.name.toLowerCase() === name.toLowerCase())) {
        toast('Already added', 'error'); return;
    }
    createTripMembers.push({ id: 'm' + Date.now(), name });
    input.value = '';
    renderCtMembers();
    input.focus();
}

function removeCtMember(idx) {
    createTripMembers.splice(idx, 1);
    renderCtMembers();
}

function saveTrip() {
    const name      = document.getElementById('ctTripName').value.trim();
    const startDate = document.getElementById('ctStartDate').value;
    const endDate   = document.getElementById('ctEndDate').value;
    if (!name) { toast('Enter a trip name', 'error'); return; }

    if (createTripEditId) {
        const idx = trips.findIndex(t => t.id === createTripEditId);
        if (idx !== -1) {
            trips[idx] = { ...trips[idx], name, emoji: createTripSelectedEmoji, startDate, endDate, members: createTripMembers };
        }
        toast('Trip updated');
    } else {
        // Auto-add "You" as first member if list is empty
        if (!createTripMembers.length) {
            const user = (typeof getUser === 'function') ? getUser() : null;
            const youName = user?.name?.split(' ')[0] || 'You';
            createTripMembers.unshift({ id: 'm_you_' + Date.now(), name: youName });
        }
        trips.push({
            id: 'trip_' + Date.now(),
            shareCode: genShareCode(),
            name, emoji: createTripSelectedEmoji, startDate, endDate,
            members: createTripMembers,
            expenses: [],
            createdAt: new Date().toISOString(),
            ownerId: (typeof currentUid !== 'undefined') ? currentUid : null,
        });
        toast(`"${name}" created!`);
    }

    saveTrips();
    closeCreateTrip();
    renderTripsPage();
}

function deleteTripConfirm(id) {
    const trip = trips.find(t => t.id === id);
    if (!trip || !confirm(`Delete "${trip.name}"? This cannot be undone.`)) return;
    trips = trips.filter(t => t.id !== id);
    saveTrips();
    activeTripId = null;
    closeTripDetail();
    toast('Trip deleted');
}

// ── Trip expense modal ────────────────────────────────────────────────
function openTripExpenseModal(expenseId = null) {
    const trip = getActiveTrip();
    if (!trip) return;
    tripExpenseEditId = expenseId || null;
    const exp   = expenseId ? (trip.expenses || []).find(e => e.id === expenseId) : null;
    const today = new Date().toISOString().split('T')[0];

    document.getElementById('teModalTitle').textContent = exp ? 'Edit Expense' : 'Add Expense';
    document.getElementById('teName').value   = exp?.name   || '';
    document.getElementById('teAmount').value = exp?.amount != null ? exp.amount : '';
    document.getElementById('teDate').value   = exp?.date   || today;
    document.getElementById('teNotes').value  = exp?.notes  || '';

    // Category
    selectedTeCat = exp?.category || 'Food & Dining';
    document.querySelectorAll('.te-cat-btn').forEach(btn =>
        btn.classList.toggle('active', btn.dataset.cat === selectedTeCat)
    );

    // Paid by
    const paidBy = exp?.paidBy || trip.members[0]?.id || '';
    renderTePaidBy(trip.members, paidBy);

    // Split between
    const splitBetween = exp?.splitBetween || trip.members.map(m => m.id);
    renderTeSplitBetween(trip.members, splitBetween);

    document.getElementById('tripExpenseBackdrop').classList.remove('hidden');
    setTimeout(() => document.getElementById('teAmount').focus(), 60);
}

function selectTeCat(cat) {
    selectedTeCat = cat;
    document.querySelectorAll('.te-cat-btn').forEach(btn =>
        btn.classList.toggle('active', btn.dataset.cat === cat)
    );
}

function renderTePaidBy(members, selectedId) {
    const el = document.getElementById('tePaidBy');
    if (!el) return;
    el.dataset.selected = selectedId;
    el.innerHTML = members.map(m => {
        const active = m.id === selectedId;
        return `<label onclick="selectTePaidBy('${m.id}', this)"
            style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;border:1.5px solid ${active?'var(--primary)':'var(--border)'};background:${active?'#f0fdf4':'white'};cursor:pointer;margin-bottom:8px;transition:all 0.12s">
            <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#22c55e,#15803d);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:700;flex-shrink:0">${(m.name[0]||'?').toUpperCase()}</div>
            <span style="flex:1;font-size:14px;font-weight:600;color:var(--text)">${escHtml(m.name)}</span>
            ${active ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
        </label>`;
    }).join('');
}

function selectTePaidBy(id, labelEl) {
    const el = document.getElementById('tePaidBy');
    el.dataset.selected = id;
    el.querySelectorAll('label').forEach(l => {
        const active = l === labelEl;
        l.style.borderColor = active ? 'var(--primary)' : 'var(--border)';
        l.style.background  = active ? '#f0fdf4' : 'white';
        const check = l.querySelector('svg');
        if (!active && check) check.remove();
        if (active && !check) {
            const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
            svg.setAttribute('width','16'); svg.setAttribute('height','16');
            svg.setAttribute('viewBox','0 0 24 24'); svg.setAttribute('fill','none');
            svg.setAttribute('stroke','var(--primary)'); svg.setAttribute('stroke-width','3');
            svg.setAttribute('stroke-linecap','round');
            svg.innerHTML = '<polyline points="20 6 9 17 4 12"/>';
            l.appendChild(svg);
        }
    });
}

function renderTeSplitBetween(members, selectedIds) {
    const el = document.getElementById('teSplitBetween');
    if (!el) return;
    el.dataset.selected = JSON.stringify(selectedIds);
    el.innerHTML = members.map(m => {
        const on = selectedIds.includes(m.id);
        return `<label onclick="toggleTeSplit('${m.id}', this)"
            style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;border:1.5px solid ${on?'var(--primary)':'var(--border)'};background:${on?'#f0fdf4':'white'};cursor:pointer;margin-bottom:8px;transition:all 0.12s">
            <div style="width:20px;height:20px;border-radius:5px;border:1.5px solid ${on?'var(--primary)':'#d1d5db'};background:${on?'var(--primary)':'white'};display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.12s">
                ${on?`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`:''}
            </div>
            <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#22c55e,#15803d);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:700;flex-shrink:0">${(m.name[0]||'?').toUpperCase()}</div>
            <span style="font-size:14px;font-weight:600;color:var(--text)">${escHtml(m.name)}</span>
        </label>`;
    }).join('');
}

function toggleTeSplit(id, labelEl) {
    const el = document.getElementById('teSplitBetween');
    let sel = JSON.parse(el.dataset.selected || '[]');
    const idx = sel.indexOf(id);
    if (idx === -1) sel.push(id); else sel.splice(idx, 1);
    el.dataset.selected = JSON.stringify(sel);

    const on  = sel.includes(id);
    labelEl.style.borderColor = on ? 'var(--primary)' : 'var(--border)';
    labelEl.style.background  = on ? '#f0fdf4' : 'white';
    const box = labelEl.querySelector('div:first-child');
    if (box) {
        box.style.borderColor = on ? 'var(--primary)' : '#d1d5db';
        box.style.background  = on ? 'var(--primary)' : 'white';
        box.innerHTML = on ? `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>` : '';
    }
}

function closeTripExpenseModal() {
    document.getElementById('tripExpenseBackdrop').classList.add('hidden');
    tripExpenseEditId = null;
}

function saveTripExpense() {
    const name   = document.getElementById('teName').value.trim();
    const amount = parseFloat(document.getElementById('teAmount').value);
    const date   = document.getElementById('teDate').value;
    const notes  = document.getElementById('teNotes').value.trim();

    if (!amount || amount <= 0) { toast('Enter a valid amount', 'error'); return; }
    if (!name)                  { toast('Enter a description', 'error'); return; }

    const paidEl       = document.getElementById('tePaidBy');
    const splitEl      = document.getElementById('teSplitBetween');
    const paidBy       = paidEl?.dataset.selected || '';
    const splitBetween = JSON.parse(splitEl?.dataset.selected || '[]');

    if (!paidBy)             { toast('Select who paid', 'error'); return; }
    if (!splitBetween.length){ toast('Select who splits this', 'error'); return; }

    const trip = getActiveTrip();
    if (!trip) return;

    if (tripExpenseEditId !== null) {
        const idx = (trip.expenses || []).findIndex(e => e.id === tripExpenseEditId);
        if (idx !== -1) trip.expenses[idx] = { ...trip.expenses[idx], name, amount, category: selectedTeCat, date, notes, paidBy, splitBetween };
        toast(`Updated — ${name}`);
    } else {
        if (!trip.expenses) trip.expenses = [];
        trip.expenses.push({ id: Date.now(), name, amount, category: selectedTeCat, date, notes, paidBy, splitBetween });
        toast(`$${amount.toFixed(2)} added`);
    }

    saveTrips();
    closeTripExpenseModal();
    renderTripDetail();
}

function deleteTripExpense(id) {
    const trip = getActiveTrip();
    if (!trip) return;
    const exp = (trip.expenses || []).find(e => e.id === id);
    if (!exp) return;
    trip.expenses = trip.expenses.filter(e => e.id !== id);
    saveTrips();
    renderTripTabContent();
    toastUndo(`Deleted "${exp.name}"`, () => {
        if (!trip.expenses) trip.expenses = [];
        trip.expenses.push(exp);
        saveTrips();
        renderTripDetail();
    });
}

// ── Share ─────────────────────────────────────────────────────────────
async function shareTripLink(tripId) {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;

    if (typeof dbSetSharedTrip === 'function') {
        try {
            await dbSetSharedTrip(trip.shareCode, {
                name: trip.name, emoji: trip.emoji,
                startDate: trip.startDate, endDate: trip.endDate,
                members: trip.members,
                expenses: (trip.expenses || []).map(({ receiptThumb, ...e }) => e),
            });
        } catch {}
    }

    const base = window.location.href.replace(/app\.html.*$/, '');
    const url  = `${base}trip.html?code=${trip.shareCode}`;

    if (navigator.share) {
        try { await navigator.share({ title: `${trip.emoji} ${trip.name} – Split`, url }); return; } catch {}
    }
    try {
        await navigator.clipboard.writeText(url);
        toast('Share link copied!');
    } catch {
        prompt('Copy this link to share:', url);
    }
}
