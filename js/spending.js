const SPEND_CATS = [
    { name: 'Food & Dining',    emoji: '🍽️', color: '#f97316' },
    { name: 'Shopping',         emoji: '🛍️', color: '#db2777' },
    { name: 'Transport',        emoji: '🚗', color: '#0891b2' },
    { name: 'Entertainment',    emoji: '🎭', color: '#7c3aed' },
    { name: 'Health & Fitness', emoji: '🏥', color: '#059669' },
    { name: 'Travel',           emoji: '✈️', color: '#0284c7' },
    { name: 'Utilities',        emoji: '💡', color: '#d97706' },
    { name: 'Other',            emoji: '📦', color: '#6b7280' },
];

let spendings          = [];
let selectedSpendCat   = 'Food & Dining';
let currentReceiptThumb = null;
let spendViewYear      = null;
let spendViewMonth     = null;
let spendCurrentTab    = 'tx';

function loadSpendings() {
    try { return JSON.parse(localStorage.getItem(getKey('spendings')) || '[]'); } catch { return []; }
}

function saveSpendings() {
    localStorage.setItem(getKey('spendings'), JSON.stringify(spendings));
    if (typeof dbSyncSpendings === 'function') dbSyncSpendings(spendings);
}

function getBudget() {
    try { return JSON.parse(localStorage.getItem(getKey('budget')) || '{"monthly":0}'); } catch { return { monthly: 0 }; }
}

function setBudget(monthly) {
    localStorage.setItem(getKey('budget'), JSON.stringify({ monthly }));
    if (typeof dbSyncSettings === 'function') dbSyncSettings({ monthly, catBudgets: getCatBudgets() });
}

function getMonthSpendings(year, month) {
    return spendings.filter(s => {
        const d = new Date(s.date + 'T00:00:00');
        return d.getFullYear() === year && d.getMonth() === month;
    });
}

function totalSpentThisMonth() {
    const now = new Date();
    return getMonthSpendings(now.getFullYear(), now.getMonth()).reduce((t, s) => t + s.amount, 0);
}

// ── Receipt image compression ─────────────────────────────────────────
function compressImage(file, cb) {
    const reader = new FileReader();
    reader.onload = e => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX = 900;
            const scale = Math.min(MAX / img.width, MAX / img.height, 1);
            canvas.width  = img.width  * scale;
            canvas.height = img.height * scale;
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            cb(canvas.toDataURL('image/jpeg', 0.72));
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ── Spending modal ────────────────────────────────────────────────────
function openSpendModal(prefill = {}) {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('spendName').value   = prefill.name   || '';
    document.getElementById('spendAmount').value = prefill.amount != null ? prefill.amount : '';
    document.getElementById('spendDate').value   = prefill.date   || today;
    document.getElementById('spendNotes').value  = prefill.notes  || '';
    document.getElementById('spendReceiptPreview').style.display = 'none';
    document.getElementById('spendReceiptImg').src = '';
    document.getElementById('spendReceiptFile').value = '';
    currentReceiptThumb = null;

    selectedSpendCat = prefill.category || 'Food & Dining';
    document.querySelectorAll('.spend-cat-btn').forEach(btn =>
        btn.classList.toggle('active', btn.dataset.cat === selectedSpendCat)
    );

    document.getElementById('spendModalBackdrop').classList.remove('hidden');
    setTimeout(() => document.getElementById('spendAmount').focus(), 60);
}

function closeSpendModal() {
    document.getElementById('spendModalBackdrop').classList.add('hidden');
    currentReceiptThumb = null;
}

function closeSpendModalBackdrop(e) {
    if (e.target === document.getElementById('spendModalBackdrop')) closeSpendModal();
}

function selectSpendCat(cat) {
    selectedSpendCat = cat;
    document.querySelectorAll('.spend-cat-btn').forEach(btn =>
        btn.classList.toggle('active', btn.dataset.cat === cat)
    );
}

function onReceiptFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    compressImage(file, thumb => {
        currentReceiptThumb = thumb;
        document.getElementById('spendReceiptImg').src = thumb;
        document.getElementById('spendReceiptPreview').style.display = 'block';
        document.getElementById('spendAmount').focus();
    });
}

function saveSpend() {
    const name   = document.getElementById('spendName').value.trim();
    const amount = parseFloat(document.getElementById('spendAmount').value);
    const date   = document.getElementById('spendDate').value;
    const notes  = document.getElementById('spendNotes').value.trim();

    if (!amount || amount <= 0) { toast('Enter a valid amount', 'error'); return; }
    if (!name)                  { toast('Enter a description', 'error'); return; }

    spendings.push({
        id: Date.now(),
        name, amount, category: selectedSpendCat, date, notes,
        source: currentReceiptThumb ? 'receipt_photo' : 'manual',
        receiptThumb: currentReceiptThumb || null,
    });
    saveSpendings();
    renderBudgetWidget();
    if (document.getElementById('page-spending').classList.contains('active')) renderSpendingPage();
    closeSpendModal();
    toast(`$${amount.toFixed(2)} logged — ${name}`);
}

function deleteSpend(id) {
    spendings = spendings.filter(s => s.id !== id);
    saveSpendings();
    renderBudgetWidget();
    renderSpendingPage();
}

function viewReceiptImage(id) {
    const s = spendings.find(x => x.id === id);
    if (!s?.receiptThumb) return;
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out';
    div.onclick = () => div.remove();
    const img = document.createElement('img');
    img.src = s.receiptThumb;
    img.style.cssText = 'max-width:90vw;max-height:90vh;border-radius:12px;object-fit:contain;box-shadow:0 0 60px rgba(0,0,0,0.5)';
    div.appendChild(img);
    document.body.appendChild(div);
}

// ── Budget widget (dashboard) ─────────────────────────────────────────
function renderBudgetWidget() {
    const el = document.getElementById('budgetWidget');
    if (!el) return;
    const budget = getBudget();
    const spent  = totalSpentThisMonth();
    const subMo  = totalMonthly();
    const total  = spent + subMo;
    const pct    = budget.monthly > 0 ? Math.min((total / budget.monthly) * 100, 100) : 0;
    const left   = budget.monthly > 0 ? budget.monthly - total : null;
    const bar    = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#16a34a';

    el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
            <div>
                <div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Total outgoing this month</div>
                <div style="font-size:28px;font-weight:800;color:var(--text);letter-spacing:-1px;line-height:1">$${total.toFixed(2)}</div>
                <div style="font-size:12px;color:var(--muted);margin-top:6px">
                    <span style="color:var(--text-2);font-weight:600">$${subMo.toFixed(2)}</span> subscriptions &nbsp;+&nbsp;
                    <span style="color:var(--text-2);font-weight:600">$${spent.toFixed(2)}</span> spending
                </div>
            </div>
            ${left !== null
                ? `<div style="text-align:right;flex-shrink:0">
                    <div style="font-size:11px;color:var(--muted);margin-bottom:2px">of $${budget.monthly.toLocaleString()} budget</div>
                    <div style="font-size:18px;font-weight:800;color:${left >= 0 ? 'var(--primary)' : '#ef4444'}">
                        ${left >= 0 ? `$${left.toFixed(0)} left` : `$${Math.abs(left).toFixed(0)} over`}
                    </div>
                    <span onclick="promptSetBudget()" style="font-size:11px;color:var(--muted);cursor:pointer;text-decoration:underline">Edit budget</span>
                  </div>`
                : `<button onclick="promptSetBudget()" style="padding:8px 16px;background:var(--primary);color:white;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;flex-shrink:0;white-space:nowrap">Set Budget</button>`
            }
        </div>
        ${budget.monthly > 0 ? `
        <div style="height:8px;background:var(--border);border-radius:99px;overflow:hidden;margin-top:16px">
            <div style="height:100%;width:${pct}%;background:${bar};border-radius:99px;transition:width 0.6s ease"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-top:5px">
            <span>${Math.round(pct)}% used</span>
            <span>${Math.round(100 - pct)}% remaining</span>
        </div>` : ''}
    `;
}

function promptSetBudget() {
    const cur = getBudget().monthly;
    const val = prompt('Set monthly budget ($):', cur || '');
    if (val === null) return;
    const n = parseFloat(val.replace(/[$,]/g, ''));
    if (isNaN(n) || n < 0) { toast('Enter a valid amount', 'error'); return; }
    setBudget(n);
    toast(`Budget set to $${n.toLocaleString()}/mo`);
    renderBudgetWidget();
    if (document.getElementById('page-spending').classList.contains('active')) renderSpendingPage();
}

// ── Spending page ────────────────────────────────────────────────────
function txDateLabel(dateStr) {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const d = new Date(dateStr + 'T00:00:00');
    const diff = Math.round((now - d) / 86400000);
    if (diff === 0) return 'TODAY';
    if (diff === 1) return 'YESTERDAY';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
}

function renderSpendingPage() {
    const now   = new Date();
    const year  = spendViewYear  !== null ? spendViewYear  : now.getFullYear();
    const month = spendViewMonth !== null ? spendViewMonth : now.getMonth();

    const budget  = getBudget();
    const entries = getMonthSpendings(year, month).sort((a, b) => new Date(b.date) - new Date(a.date));
    const spent   = entries.reduce((t, s) => t + s.amount, 0);
    const subMo   = totalMonthly();
    const total   = spent + subMo;
    const pct     = budget.monthly > 0 ? Math.min((total / budget.monthly) * 100, 100) : 0;
    const bar     = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#16a34a';
    const left    = budget.monthly > 0 ? budget.monthly - total : null;

    document.getElementById('spendMonthLabel').textContent =
        new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    document.getElementById('spendSummary').innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
            <div class="spend-stat">
                <div class="spend-stat-label">Spent</div>
                <div class="spend-stat-val">$${spent.toFixed(2)}</div>
            </div>
            <div class="spend-stat">
                <div class="spend-stat-label">Subscriptions</div>
                <div class="spend-stat-val">$${subMo.toFixed(2)}</div>
            </div>
            <div class="spend-stat${left !== null && left < 0 ? ' over-budget' : ''}"
                 ${budget.monthly === 0 ? 'onclick="promptSetBudget()" style="cursor:pointer;border:2px dashed var(--border)!important"' : ''}>
                <div class="spend-stat-label">Budget Left</div>
                <div class="spend-stat-val" style="color:${left === null ? 'var(--muted)' : left >= 0 ? 'var(--primary)' : '#ef4444'}">
                    ${left === null ? '<span style="font-size:13px">Tap to set</span>' : `$${left.toFixed(2)}`}
                </div>
            </div>
        </div>
        ${budget.monthly > 0 ? `
        <div style="background:white;border-radius:12px;padding:14px 18px;border:1px solid var(--border-soft);margin-bottom:16px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:7px">
                <span style="font-size:12px;color:var(--muted)">$${total.toFixed(2)} of $${budget.monthly.toLocaleString()} (${Math.round(pct)}%)</span>
                <span onclick="promptSetBudget()" style="font-size:12px;color:var(--primary);font-weight:600;cursor:pointer">Edit</span>
            </div>
            <div style="height:8px;background:var(--border);border-radius:99px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:${bar};border-radius:99px;transition:width 0.5s"></div>
            </div>
        </div>` : ''}
    `;

    // Always re-render categories if that tab is active
    if (spendCurrentTab === 'cat') {
        renderCategoriesTab(entries, spent, year, month);
        return;
    }

    // Transactions tab — flat Copilot-style list
    const listEl = document.getElementById('spendList');
    if (!entries.length) {
        listEl.innerHTML = `<div class="empty-state">
            <div class="empty-icon">💸</div>
            <div class="empty-title">No spending logged yet</div>
            <div class="empty-sub">Tap "+ Add Expense" or connect Gmail to auto-detect receipts.</div>
        </div>`;
        return;
    }

    const byDate = {};
    entries.forEach(s => { (byDate[s.date] = byDate[s.date] || []).push(s); });

    listEl.innerHTML = Object.entries(byDate).map(([date, items]) => {
        const dayTotal = items.reduce((t, s) => t + s.amount, 0);
        return `
            <div style="margin-bottom:20px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding:0 2px">
                    <span style="font-size:11px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:0.8px">${txDateLabel(date)}</span>
                    <span style="font-size:12px;font-weight:600;color:var(--muted)">$${dayTotal.toFixed(2)}</span>
                </div>
                <div style="background:white;border-radius:14px;border:1px solid var(--border-soft);overflow:hidden">
                    ${items.map((s, i) => {
                        const c = SPEND_CATS.find(x => x.name === s.category) || SPEND_CATS[7];
                        return `<div style="display:flex;align-items:center;gap:12px;padding:13px 16px;${i < items.length - 1 ? 'border-bottom:1px solid #f0fdf4' : ''}">
                            <div style="width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:19px;background:${c.color}18;flex-shrink:0">${c.emoji}</div>
                            <div style="flex:1;min-width:0">
                                <div style="font-size:14px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(s.name)}</div>
                                <div style="font-size:11px;color:var(--muted);margin-top:1px">${s.notes ? escHtml(s.notes) : (s.source === 'gmail' ? '📧 auto-detected' : s.source === 'receipt_photo' ? '📷 receipt' : 'manual')}</div>
                            </div>
                            <span style="display:inline-flex;align-items:center;gap:3px;padding:3px 8px;border-radius:99px;background:${c.color}15;flex-shrink:0">
                                <span style="font-size:11px">${c.emoji}</span>
                                <span style="font-size:10px;font-weight:700;color:${c.color};text-transform:uppercase;letter-spacing:0.3px;white-space:nowrap">${s.category}</span>
                            </span>
                            ${s.receiptThumb ? `<img src="${s.receiptThumb}" onclick="viewReceiptImage(${s.id})" style="width:34px;height:34px;border-radius:7px;object-fit:cover;cursor:zoom-in;flex-shrink:0" title="View receipt" />` : ''}
                            <div style="font-size:15px;font-weight:700;color:var(--text);white-space:nowrap;min-width:52px;text-align:right">$${s.amount.toFixed(2)}</div>
                            <button onclick="deleteSpend(${s.id})" style="padding:5px;border:none;background:none;cursor:pointer;color:#d1d5db;line-height:1;flex-shrink:0" title="Delete">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function prevSpendMonth() {
    const now   = new Date();
    const year  = spendViewYear  !== null ? spendViewYear  : now.getFullYear();
    const month = spendViewMonth !== null ? spendViewMonth : now.getMonth();
    const d = new Date(year, month - 1, 1);
    spendViewYear  = d.getFullYear();
    spendViewMonth = d.getMonth();
    renderSpendingPage();
}

function nextSpendMonth() {
    const now   = new Date();
    const year  = spendViewYear  !== null ? spendViewYear  : now.getFullYear();
    const month = spendViewMonth !== null ? spendViewMonth : now.getMonth();
    if (year === now.getFullYear() && month === now.getMonth()) return;
    const d = new Date(year, month + 1, 1);
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
        spendViewYear = spendViewMonth = null;
    } else {
        spendViewYear  = d.getFullYear();
        spendViewMonth = d.getMonth();
    }
    renderSpendingPage();
}

// ── Spending tab switcher ─────────────────────────────────────────────
function showSpendTab(tab) {
    spendCurrentTab = tab;
    document.getElementById('spendTabTx').classList.toggle('active', tab === 'tx');
    document.getElementById('spendTabCat').classList.toggle('active', tab === 'cat');
    document.getElementById('spendTxView').classList.toggle('hidden', tab !== 'tx');
    document.getElementById('spendCatView').classList.toggle('hidden', tab !== 'cat');
    renderSpendingPage();
}

// ── Per-category budgets ──────────────────────────────────────────────
function getCatBudgets() {
    try { return JSON.parse(localStorage.getItem(getKey('cat_budgets')) || '{}'); } catch { return {}; }
}

function setCatBudget(cat, amount) {
    const budgets = getCatBudgets();
    if (amount > 0) budgets[cat] = amount; else delete budgets[cat];
    localStorage.setItem(getKey('cat_budgets'), JSON.stringify(budgets));
    if (typeof dbSyncSettings === 'function') dbSyncSettings({ monthly: getBudget().monthly, catBudgets: budgets });
}

function promptCatBudget(cat) {
    const cur = getCatBudgets()[cat];
    const val = prompt(`Monthly budget for ${cat} ($):`, cur || '');
    if (val === null) return;
    const n = parseFloat(val.replace(/[$,]/g, ''));
    if (isNaN(n) || n < 0) { toast('Enter a valid amount', 'error'); return; }
    setCatBudget(cat, n);
    toast(`${cat} budget set to $${n.toFixed(0)}/mo`);
    const now = new Date();
    const year = spendViewYear !== null ? spendViewYear : now.getFullYear();
    const month = spendViewMonth !== null ? spendViewMonth : now.getMonth();
    const entries = getMonthSpendings(year, month);
    const spent = entries.reduce((t, s) => t + s.amount, 0);
    renderCategoriesTab(entries, spent, year, month);
}

// ── Multi-segment donut SVG ───────────────────────────────────────────
function multiDonutSVG(segments, total, size = 160) {
    const cx = size / 2, cy = size / 2, r = (size - 20) / 2;
    const circ = 2 * Math.PI * r;
    const bg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#f0fdf4" stroke-width="16"/>`;

    if (!segments.length || !total) {
        return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${bg}
            <text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="13" fill="#9ca3af" font-family="Plus Jakarta Sans,sans-serif">No data</text>
        </svg>`;
    }

    const GAP = circ * 0.012;
    let offset = 0;
    const arcs = segments.map(seg => {
        const len = Math.max(0, (seg.amount / total) * circ - GAP);
        const arc = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${seg.color}" stroke-width="16"
            stroke-dasharray="${len} ${circ}" stroke-dashoffset="${-offset}"
            stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>`;
        offset += len + GAP;
        return arc;
    });

    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        ${bg}${arcs.join('')}
        <text x="${cx}" y="${cy - 8}" text-anchor="middle" font-size="16" font-weight="800" fill="#052e16" font-family="Plus Jakarta Sans,sans-serif">$${total.toFixed(0)}</text>
        <text x="${cx}" y="${cy + 11}" text-anchor="middle" font-size="10" fill="#6b7280" font-family="Plus Jakarta Sans,sans-serif">this month</text>
    </svg>`;
}

// ── Categories tab ────────────────────────────────────────────────────
function renderCategoriesTab(entries, spent, year, month) {
    if (!entries) {
        const now = new Date();
        year  = spendViewYear  !== null ? spendViewYear  : now.getFullYear();
        month = spendViewMonth !== null ? spendViewMonth : now.getMonth();
        entries = getMonthSpendings(year, month);
        spent = entries.reduce((t, s) => t + s.amount, 0);
    }

    const catBudgets = getCatBudgets();
    const catMap = {};
    entries.forEach(s => { catMap[s.category] = (catMap[s.category] || 0) + s.amount; });
    const cats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

    const segments = cats.map(([cat]) => {
        const c = SPEND_CATS.find(x => x.name === cat) || SPEND_CATS[7];
        return { amount: catMap[cat], color: c.color };
    });

    const el = document.getElementById('spendCatView');
    if (!el) return;

    if (!cats.length) {
        el.innerHTML = `<div class="empty-state">
            <div class="empty-icon">🍩</div>
            <div class="empty-title">No spending yet</div>
            <div class="empty-sub">Add expenses to see your category breakdown.</div>
        </div>`;
        return;
    }

    // Legend items for donut
    const legend = cats.map(([cat]) => {
        const c = SPEND_CATS.find(x => x.name === cat) || SPEND_CATS[7];
        const p = spent > 0 ? Math.round((catMap[cat] / spent) * 100) : 0;
        return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <div style="width:10px;height:10px;border-radius:50%;background:${c.color};flex-shrink:0"></div>
            <span style="font-size:13px;font-weight:600;color:var(--text);flex:1">${cat}</span>
            <span style="font-size:12px;color:var(--muted)">${p}%</span>
        </div>`;
    }).join('');

    // Per-category budget rows
    const rows = SPEND_CATS.map(c => {
        const amt = catMap[c.name] || 0;
        const limit = catBudgets[c.name] || 0;
        const pct = limit > 0 ? Math.min((amt / limit) * 100, 100) : 0;
        const barColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#16a34a';
        const hasSpend = amt > 0;

        if (!hasSpend && !limit) return '';

        return `<div style="display:flex;align-items:center;gap:12px;padding:14px 20px;border-bottom:1px solid #f0fdf4">
            <div style="width:40px;height:40px;border-radius:11px;background:${c.color}15;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">${c.emoji}</div>
            <div style="flex:1;min-width:0">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
                    <span style="font-size:13px;font-weight:700;color:var(--text)">${c.name}</span>
                    <span style="font-size:12px;font-weight:600;color:${limit > 0 && amt > limit ? '#ef4444' : 'var(--muted)'}">
                        $${amt.toFixed(0)}${limit > 0 ? ` / $${limit.toFixed(0)}` : ''}
                    </span>
                </div>
                ${limit > 0 ? `<div style="height:6px;background:#f0fdf4;border-radius:99px;overflow:hidden">
                    <div style="height:100%;width:${pct}%;background:${barColor};border-radius:99px;transition:width 0.5s"></div>
                </div>` : `<div style="font-size:11px;color:var(--muted)">No limit set</div>`}
            </div>
            <button onclick="promptCatBudget('${c.name}')" style="padding:5px 10px;border:1.5px solid var(--border);border-radius:7px;background:white;font-size:11px;font-weight:700;color:var(--primary-dark);cursor:pointer;white-space:nowrap;font-family:inherit">${limit > 0 ? 'Edit' : 'Set limit'}</button>
        </div>`;
    }).filter(Boolean).join('');

    el.innerHTML = `
        <div style="background:white;border-radius:14px;border:1px solid var(--border-soft);overflow:hidden;margin-bottom:16px">
            <div style="padding:20px;display:flex;align-items:center;gap:24px;flex-wrap:wrap">
                <div style="flex-shrink:0">${multiDonutSVG(segments, spent)}</div>
                <div style="flex:1;min-width:140px">${legend}</div>
            </div>
        </div>
        <div style="background:white;border-radius:14px;border:1px solid var(--border-soft);overflow:hidden">
            <div style="padding:14px 20px;border-bottom:1px solid #f0fdf4;background:linear-gradient(135deg,var(--primary-xlight),#ecfdf5)">
                <span style="font-size:13px;font-weight:700;color:var(--text)">Spending by Category</span>
                <span style="font-size:12px;color:var(--muted);margin-left:8px">Tap "Set limit" to add a budget</span>
            </div>
            ${rows || `<div style="padding:24px 20px;text-align:center;color:var(--muted);font-size:13px">No spending this month</div>`}
        </div>
    `;
}
