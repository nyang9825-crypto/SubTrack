let qaCategory    = null;
let qaReceiptThumb = null;
let homeViewYear  = null;
let homeViewMonth = null;

// ── Home page render ──────────────────────────────────────────────────
function renderHomePage() {
    const user = getUser();
    const now  = new Date();
    const h    = now.getHours();
    const greeting = h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    const firstName = user?.name?.split(' ')[0] || '';

    const greetEl = document.getElementById('homeGreeting');
    if (greetEl) greetEl.textContent = `${greeting}${firstName ? ', ' + firstName : ''} 👋`;

    const dateEl = document.getElementById('homeTodayDate');
    if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    renderHomeBudget();
    renderHomeChart();
    renderQuickGrid();
    renderRecentSpends();
}

function _homeYM() {
    const now = new Date();
    return {
        year:  homeViewYear  !== null ? homeViewYear  : now.getFullYear(),
        month: homeViewMonth !== null ? homeViewMonth : now.getMonth(),
    };
}

function prevHomeMonth() {
    const { year, month } = _homeYM();
    const d = new Date(year, month - 1, 1);
    homeViewYear  = d.getFullYear();
    homeViewMonth = d.getMonth();
    renderHomeBudget();
    renderHomeChart();
    renderQuickGrid();
    renderRecentSpends();
}

function nextHomeMonth() {
    const now = new Date();
    const { year, month } = _homeYM();
    if (year === now.getFullYear() && month === now.getMonth()) return;
    const d = new Date(year, month + 1, 1);
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
        homeViewYear = homeViewMonth = null;
    } else {
        homeViewYear  = d.getFullYear();
        homeViewMonth = d.getMonth();
    }
    renderHomeBudget();
    renderHomeChart();
    renderQuickGrid();
    renderRecentSpends();
}

function jumpHomeMonth(year, month) {
    const now = new Date();
    if (year === now.getFullYear() && month === now.getMonth()) {
        homeViewYear = homeViewMonth = null;
    } else {
        homeViewYear  = year;
        homeViewMonth = month;
    }
    renderHomeBudget();
    renderHomeChart();
    renderQuickGrid();
    renderRecentSpends();
}

// ── Budget card with month nav ────────────────────────────────────────
function renderHomeBudget() {
    const el = document.getElementById('homeBudgetStrip');
    if (!el) return;
    const now  = new Date();
    const { year, month } = _homeYM();
    const isCurrent = (homeViewYear === null) ||
        (year === now.getFullYear() && month === now.getMonth());

    const budget     = getBudget();
    const entries    = getMonthSpendings(year, month);
    const spentSelf  = entries.reduce((t, s) => t + s.amount, 0);
    const spentTotal = spentSelf + totalMonthly();
    const pct  = budget.monthly > 0 ? Math.min((spentTotal / budget.monthly) * 100, 100) : 0;
    const bar  = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#16a34a';
    const left = budget.monthly > 0 ? budget.monthly - spentTotal : null;
    const monthLabel = new Date(year, month, 1)
        .toLocaleString('en-US', { month: 'long', year: 'numeric' });

    el.innerHTML = `
        <div class="home-budget-card">
            <!-- Month nav row -->
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
                <button onclick="prevHomeMonth()"
                    style="width:34px;height:34px;border-radius:10px;border:1.5px solid var(--border);background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--text-2);font-family:inherit;transition:background 0.12s"
                    onmouseover="this.style.background='var(--primary-xlight)'"
                    onmouseout="this.style.background='white'">‹</button>
                <div style="text-align:center;flex:1;padding:0 10px">
                    <div style="font-size:20px;font-weight:800;color:var(--text);letter-spacing:-0.5px;line-height:1">${monthLabel}</div>
                    ${isCurrent ? `<div style="font-size:11px;color:var(--primary);font-weight:600;margin-top:3px">● Today</div>` : ''}
                </div>
                <button onclick="nextHomeMonth()"
                    style="width:34px;height:34px;border-radius:10px;border:1.5px solid var(--border);background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;font-family:inherit;transition:background 0.12s;color:${isCurrent ? '#d1d5db' : 'var(--text-2)'}"
                    ${isCurrent ? 'disabled' : ''}
                    onmouseover="this.style.background='${isCurrent ? 'white' : 'var(--primary-xlight)'}'"
                    onmouseout="this.style.background='white'">›</button>
            </div>

            <!-- Totals -->
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
                <div>
                    <div style="font-size:36px;font-weight:800;color:var(--text);letter-spacing:-2px;line-height:1">$${spentTotal.toFixed(2)}</div>
                    <div style="font-size:12px;color:var(--muted);margin-top:6px">
                        <span style="color:var(--text-2);font-weight:600">$${totalMonthly().toFixed(2)}</span> subs
                        &nbsp;+&nbsp;
                        <span style="color:var(--text-2);font-weight:600">$${spentSelf.toFixed(2)}</span> spent
                    </div>
                </div>
                ${left !== null
                    ? `<div style="text-align:right;flex-shrink:0">
                        <div style="font-size:11px;color:var(--muted)">of $${budget.monthly.toLocaleString()}</div>
                        <div style="font-size:20px;font-weight:800;color:${left >= 0 ? 'var(--primary)' : '#ef4444'};margin-top:3px;letter-spacing:-0.5px">
                            $${Math.abs(left).toFixed(0)} ${left >= 0 ? 'left' : 'over'}
                        </div>
                        <span onclick="promptSetBudget()" style="font-size:11px;color:var(--muted);cursor:pointer;text-decoration:underline">Edit</span>
                      </div>`
                    : `<button onclick="promptSetBudget()"
                        style="padding:8px 14px;background:var(--primary-xlight);border:1.5px solid var(--border);border-radius:9px;font-size:12px;font-weight:700;color:var(--primary-dark);cursor:pointer;font-family:inherit;flex-shrink:0">Set budget</button>`
                }
            </div>
            ${budget.monthly > 0 ? `
            <div style="height:7px;background:var(--border-soft);border-radius:99px;overflow:hidden;margin-top:16px">
                <div style="height:100%;width:${pct}%;background:${bar};border-radius:99px;transition:width 0.6s ease"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-top:4px">
                <span>${Math.round(pct)}% used</span><span>${Math.round(100 - pct)}% left</span>
            </div>` : ''}
        </div>
    `;
}

// ── Monthly bar chart ─────────────────────────────────────────────────
function renderHomeChart() {
    const el = document.getElementById('homeChartArea');
    if (!el) return;

    const now = new Date();
    const { year: curY, month: curM } = _homeYM();

    // Build last 4 months ending at currently viewed month
    const months = [];
    for (let i = 3; i >= 0; i--) {
        const d = new Date(curY, curM - i, 1);
        const y = d.getFullYear(), m = d.getMonth();
        const entries = getMonthSpendings(y, m);
        const spending = entries.reduce((t, s) => t + s.amount, 0);
        const subs     = totalMonthly();
        months.push({
            label:    d.toLocaleString('en-US', { month: 'short' }),
            year: y, month: m,
            spending, subs,
            total:    spending + subs,
            isActive: (y === curY && m === curM),
        });
    }

    const maxTotal = Math.max(...months.map(m => m.total), 50);
    const W = 320, H = 148;
    const LABEL_H = 22, VALUE_H = 16, CHART_H = H - LABEL_H - VALUE_H;
    const barW = 54, gap = (W - 4 * barW) / 5;

    const bars = months.map((mo, i) => {
        const x      = gap + i * (barW + gap);
        const subsH  = Math.round((mo.subs     / maxTotal) * CHART_H * 0.88);
        const spendH = Math.round((mo.spending / maxTotal) * CHART_H * 0.88);
        const totalH = subsH + spendH;
        const yBase  = VALUE_H + CHART_H;
        const active = mo.isActive;

        const spendColor = active ? '#16a34a' : '#6ee7b7';
        const subsColor  = active ? '#86efac' : '#d1fae5';

        return `<g onclick="jumpHomeMonth(${mo.year},${mo.month})" style="cursor:pointer">
            ${totalH > 2 ? `
                <rect x="${x}" y="${yBase - totalH}" width="${barW}" height="${totalH}" rx="8" fill="${subsColor}"/>
                ${spendH > 0 ? `<rect x="${x}" y="${yBase - totalH}" width="${barW}" height="${spendH}" rx="8" fill="${spendColor}"/>` : ''}
                ${active ? `<text x="${x + barW / 2}" y="${yBase - totalH - 5}"
                    text-anchor="middle" font-size="10" font-weight="800" fill="#15803d"
                    font-family="Plus Jakarta Sans,sans-serif">$${mo.total.toFixed(0)}</text>` : ''}
            ` : `<rect x="${x}" y="${yBase - 4}" width="${barW}" height="4" rx="2" fill="#f0fdf4"/>`}
            <text x="${x + barW / 2}" y="${H - 3}" text-anchor="middle"
                font-size="12" font-weight="${active ? '800' : '600'}"
                fill="${active ? '#15803d' : '#9ca3af'}"
                font-family="Plus Jakarta Sans,sans-serif">${mo.label}</text>
        </g>`;
    }).join('');

    el.innerHTML = `
        <div style="background:white;border-radius:18px;border:1px solid var(--border-soft);padding:18px 20px 14px;margin-bottom:24px;box-shadow:var(--shadow)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
                <span style="font-size:14px;font-weight:800;color:var(--text)">Monthly Overview</span>
                <div style="display:flex;align-items:center;gap:14px">
                    <span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--muted)">
                        <span style="width:9px;height:9px;border-radius:2px;background:#16a34a;display:inline-block"></span>Spending
                    </span>
                    <span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--muted)">
                        <span style="width:9px;height:9px;border-radius:2px;background:#86efac;display:inline-block"></span>Subs
                    </span>
                </div>
            </div>
            <svg width="100%" viewBox="0 0 ${W} ${H}" style="overflow:visible;display:block">
                ${bars}
            </svg>
        </div>
    `;
}

// ── Category quick-add grid ───────────────────────────────────────────
function renderQuickGrid() {
    const el = document.getElementById('catQuickGrid');
    if (!el) return;
    const { year, month } = _homeYM();
    const monthEntries = getMonthSpendings(year, month);

    el.innerHTML = SPEND_CATS.map(c => {
        const catTotal = monthEntries.filter(s => s.category === c.name).reduce((t, s) => t + s.amount, 0);
        const sub = catTotal > 0 ? `$${catTotal.toFixed(0)} this month` : 'Tap to add';
        return `<button class="cat-quick-btn" onclick="openQuickAdd('${c.name.replace(/'/g, "\\'")}')"
            style="background:${c.color}10;border-color:${c.color}28;">
            <span class="cqb-emoji">${c.emoji}</span>
            <span class="cqb-label">${escHtml(c.name)}</span>
            <span class="cqb-sub">${sub}</span>
        </button>`;
    }).join('');
}

// ── Recent spending list ──────────────────────────────────────────────
function renderRecentSpends() {
    const el = document.getElementById('homeRecentList');
    if (!el) return;
    const { year, month } = _homeYM();
    const monthEntries = getMonthSpendings(year, month);
    const recent = [...monthEntries].sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return b.id - a.id;
    }).slice(0, 5);

    if (!recent.length) {
        el.innerHTML = `<div style="background:white;border:1px solid var(--border-soft);border-radius:18px;padding:28px 20px;text-align:center">
            <div style="font-size:36px;margin-bottom:10px">💸</div>
            <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:5px">No expenses yet</div>
            <div style="font-size:13px;color:var(--muted)">Tap a category above to log your first</div>
        </div>`;
        return;
    }

    el.innerHTML = `<div style="background:white;border:1px solid var(--border-soft);border-radius:18px;overflow:hidden">
        ${recent.map((s, i) => {
            const c = SPEND_CATS.find(x => x.name === s.category) || SPEND_CATS[7];
            return `<div style="display:flex;align-items:center;gap:12px;padding:14px 18px;${i < recent.length - 1 ? 'border-bottom:1px solid #f0fdf4' : ''}">
                <div style="width:44px;height:44px;border-radius:13px;background:${c.color}15;display:flex;align-items:center;justify-content:center;font-size:21px;flex-shrink:0">${c.emoji}</div>
                <div style="flex:1;min-width:0">
                    <div style="font-size:14px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(s.name)}</div>
                    <div style="font-size:11px;color:var(--muted);margin-top:1px">${txDateLabel(s.date)} · ${s.category}</div>
                </div>
                ${s.receiptThumb ? `<img src="${s.receiptThumb}" onclick="viewReceiptImage(${s.id})" style="width:34px;height:34px;border-radius:7px;object-fit:cover;cursor:zoom-in;flex-shrink:0" />` : ''}
                <div style="font-size:16px;font-weight:700;color:var(--text);white-space:nowrap">$${s.amount.toFixed(2)}</div>
            </div>`;
        }).join('')}
    </div>`;
}

// ── Quick Add modal ───────────────────────────────────────────────────
function openQuickAdd(cat) {
    qaCategory = cat;
    const c = SPEND_CATS.find(x => x.name === cat) || SPEND_CATS[7];
    const icon = document.getElementById('qaCatIcon');
    icon.textContent = c.emoji;
    icon.style.background   = `${c.color}18`;
    icon.style.borderColor  = `${c.color}30`;
    document.getElementById('qaCatName').textContent  = cat;
    document.getElementById('qaAmount').value         = '';
    document.getElementById('qaDesc').value           = '';
    document.getElementById('qaDate').value           = new Date().toISOString().split('T')[0];
    document.getElementById('qaAmount').style.borderColor = 'var(--border)';
    qaReceiptThumb = null;
    document.getElementById('qaReceiptCamera').value  = '';
    document.getElementById('qaReceiptGallery').value = '';
    document.getElementById('qaReceiptPreview').style.display = 'none';
    document.getElementById('qaReceiptImg').src       = '';
    document.getElementById('qaReceiptBtns').style.display   = '';
    document.getElementById('quickAddBackdrop').classList.remove('hidden');
    setTimeout(() => document.getElementById('qaAmount').focus(), 80);
}

function closeQuickAdd() {
    document.getElementById('quickAddBackdrop').classList.add('hidden');
    qaCategory     = null;
    qaReceiptThumb = null;
}

function onQaReceiptChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    compressImage(file, thumb => {
        qaReceiptThumb = thumb;
        document.getElementById('qaReceiptImg').src = thumb;
        document.getElementById('qaReceiptPreview').style.display = 'block';
        document.getElementById('qaReceiptBtns').style.display    = 'none';
    });
}

function removeQaReceipt() {
    qaReceiptThumb = null;
    document.getElementById('qaReceiptCamera').value  = '';
    document.getElementById('qaReceiptGallery').value = '';
    document.getElementById('qaReceiptImg').src       = '';
    document.getElementById('qaReceiptPreview').style.display = 'none';
    document.getElementById('qaReceiptBtns').style.display    = '';
}

function submitQuickAdd() {
    const amount = parseFloat(document.getElementById('qaAmount').value);
    const desc   = document.getElementById('qaDesc').value.trim();
    const date   = document.getElementById('qaDate').value;
    const amtEl  = document.getElementById('qaAmount');

    if (!amount || amount <= 0) {
        amtEl.style.borderColor = '#ef4444';
        amtEl.focus();
        setTimeout(() => amtEl.style.borderColor = 'var(--border)', 1500);
        return;
    }

    spendings.push({
        id: Date.now(), name: desc || qaCategory,
        amount, category: qaCategory, date,
        notes: '', source: qaReceiptThumb ? 'receipt_photo' : 'manual',
        receiptThumb: qaReceiptThumb || null,
    });
    saveSpendings();
    closeQuickAdd();
    renderHomePage();
    renderBudgetWidget();
    toast(`$${amount.toFixed(2)} — ${desc || qaCategory}`);
}
