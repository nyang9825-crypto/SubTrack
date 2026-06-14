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

function loadSpendings() {
    try { return JSON.parse(localStorage.getItem('sprout_spendings') || '[]'); } catch { return []; }
}

function saveSpendings() {
    localStorage.setItem('sprout_spendings', JSON.stringify(spendings));
}

function getBudget() {
    try { return JSON.parse(localStorage.getItem('sprout_budget') || '{"monthly":0}'); } catch { return { monthly: 0 }; }
}

function setBudget(monthly) {
    localStorage.setItem('sprout_budget', JSON.stringify({ monthly }));
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
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:${budget.monthly > 0 ? '16px' : '20px'}">
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
        <div style="background:white;border-radius:12px;padding:16px 20px;border:1px solid var(--border-soft);margin-bottom:20px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <span style="font-size:12px;color:var(--muted)">$${total.toFixed(2)} of $${budget.monthly.toLocaleString()} (${Math.round(pct)}%)</span>
                <span onclick="promptSetBudget()" style="font-size:12px;color:var(--primary);font-weight:600;cursor:pointer">Edit budget</span>
            </div>
            <div style="height:10px;background:var(--border);border-radius:99px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:${bar};border-radius:99px;transition:width 0.5s"></div>
            </div>
        </div>` : ''}
    `;

    // Category breakdown
    const catMap = {};
    entries.forEach(s => { catMap[s.category] = (catMap[s.category] || 0) + s.amount; });
    const cats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

    document.getElementById('spendCatBreakdown').innerHTML = cats.length === 0 ? '' : `
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">
            ${cats.map(([cat, amt]) => {
                const c = SPEND_CATS.find(x => x.name === cat) || SPEND_CATS[7];
                const p = spent > 0 ? Math.round((amt / spent) * 100) : 0;
                return `<div style="background:white;border:1px solid var(--border-soft);border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:8px">
                    <span style="font-size:18px">${c.emoji}</span>
                    <div>
                        <div style="font-size:12px;font-weight:700;color:var(--text)">${cat}</div>
                        <div style="font-size:11px;color:var(--muted)">$${amt.toFixed(2)} · ${p}%</div>
                    </div>
                </div>`;
            }).join('')}
        </div>
    `;

    // Transaction list grouped by date
    const listEl = document.getElementById('spendList');
    if (!entries.length) {
        listEl.innerHTML = `<div class="empty-state">
            <div class="empty-icon">💸</div>
            <div class="empty-title">No spending logged yet</div>
            <div class="empty-sub">Tap "Add Expense" or upload a receipt photo to get started.</div>
        </div>`;
        return;
    }

    const byDate = {};
    entries.forEach(s => { (byDate[s.date] = byDate[s.date] || []).push(s); });

    listEl.innerHTML = Object.entries(byDate).map(([date, items]) => {
        const label    = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const dayTotal = items.reduce((t, s) => t + s.amount, 0);
        return `
            <div style="margin-bottom:16px">
                <div style="display:flex;justify-content:space-between;align-items:center;padding:0 2px;margin-bottom:6px">
                    <span style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px">${label}</span>
                    <span style="font-size:12px;font-weight:600;color:var(--muted)">$${dayTotal.toFixed(2)}</span>
                </div>
                <div style="background:white;border-radius:12px;border:1px solid var(--border-soft);overflow:hidden">
                    ${items.map((s, i) => {
                        const c = SPEND_CATS.find(x => x.name === s.category) || SPEND_CATS[7];
                        return `<div style="display:flex;align-items:center;gap:12px;padding:14px 16px;${i < items.length - 1 ? 'border-bottom:1px solid var(--border-soft)' : ''}">
                            <div style="width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;background:${c.color}18;flex-shrink:0">${c.emoji}</div>
                            <div style="flex:1;min-width:0">
                                <div style="font-size:14px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(s.name)}</div>
                                <div style="font-size:12px;color:var(--muted)">${s.category}${s.source === 'receipt_photo' ? ' · 📷' : s.source === 'gmail' ? ' · 📧 auto-detected' : ''}</div>
                            </div>
                            ${s.receiptThumb ? `<img src="${s.receiptThumb}" onclick="viewReceiptImage(${s.id})" style="width:38px;height:38px;border-radius:8px;object-fit:cover;cursor:zoom-in;flex-shrink:0" title="View receipt" />` : ''}
                            <div style="font-size:15px;font-weight:700;color:var(--text);white-space:nowrap">$${s.amount.toFixed(2)}</div>
                            <button onclick="deleteSpend(${s.id})" style="padding:5px;border:none;background:none;cursor:pointer;color:#9ca3af;line-height:1;flex-shrink:0" title="Delete">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
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
