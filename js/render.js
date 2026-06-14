function renderAll() {
    renderDashboard();
    renderSubscriptions();
    renderAnalytics();
    renderUpcoming();
    renderBudgetWidget();
}

function renderDashboard() {
    const monthly = totalMonthly();
    const yearly  = monthly * 12;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const in7  = new Date(now.getTime() + 7 * 86400000);
    const in30 = new Date(now.getTime() + 30 * 86400000);

    const weekRenewals = subs.filter(s => {
        const d = new Date(s.renewalDate + 'T00:00:00');
        return d >= now && d <= in7;
    });

    const upcoming30 = subs.filter(s => {
        const d = new Date(s.renewalDate + 'T00:00:00');
        return d >= now && d <= in30;
    }).sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));

    animateValue(document.getElementById('dashMonthly'),     monthly,           true);
    animateValue(document.getElementById('dashYearly'),      yearly,            true);
    animateValue(document.getElementById('dashCount'),       subs.length,       false);
    animateValue(document.getElementById('dashWeekRenewals'),weekRenewals.length,false);
    document.getElementById('dashUpcomingBadge').textContent = `${weekRenewals.length} this week`;

    const list = document.getElementById('dashUpcomingList');
    list.innerHTML = upcoming30.length === 0
        ? emptyState('empty_ok', 'Nothing due soon', 'No renewals in the next 30 days.')
        : upcoming30.map(s => renderSubItem(s, true)).join('');
}

function emptyState(icon, title, sub) {
    return `<div class="empty-state"><div class="empty-icon-svg">${ICONS[icon] || ICONS.empty_list}</div><div class="empty-title">${title}</div><div class="empty-sub">${sub}</div></div>`;
}

function renderSubscriptions() {
    const query = (document.getElementById('searchInput')?.value || '').toLowerCase();

    // Build category counts
    const catCounts = { All: subs.length };
    subs.forEach(s => { catCounts[s.category] = (catCounts[s.category] || 0) + 1; });
    const categories = ['All', ...new Set(subs.map(s => s.category))];

    document.getElementById('categoryChips').innerHTML = categories.map(c => `
        <button class="cat-chip ${c === filterCategory ? 'active' : ''}" onclick="setFilter('${c}')">
            ${c} <span class="chip-count">${catCounts[c] || 0}</span>
        </button>
    `).join('');

    let filtered = subs.filter(s => {
        const matchCat    = filterCategory === 'All' || s.category === filterCategory;
        const matchSearch = !query || s.name.toLowerCase().includes(query) || s.category.toLowerCase().includes(query);
        return matchCat && matchSearch;
    });
    filtered = filtered.slice().sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));

    const list = document.getElementById('subList');
    if (filtered.length === 0) {
        list.innerHTML = subs.length === 0
            ? emptyState('empty_list',   'No subscriptions yet', 'Click "+ Add New" to track your first subscription.')
            : emptyState('empty_search', 'No matches',           'Try a different search or filter.');
    } else {
        list.innerHTML = filtered.map(s => renderSubItem(s, true)).join('');
    }
}

function renderAnalytics() {
    const monthly = totalMonthly();
    animateValue(document.getElementById('anaDaily'), monthly / 30, true);

    if (subs.length === 0) {
        document.getElementById('anaAvg').textContent              = '0.00';
        document.getElementById('anaMostExpensive').textContent    = '—';
        document.getElementById('anaMostExpensiveSub').textContent = 'no subs yet';
        document.getElementById('anaTopCat').textContent           = '—';
        document.getElementById('anaTopCatSub').textContent        = 'by spend';
        document.getElementById('catBreakdown').innerHTML = emptyState('empty_chart', 'No data yet', 'Add subscriptions to see your breakdown.');
        return;
    }

    animateValue(document.getElementById('anaAvg'), monthly / subs.length, true);

    const sorted = subs.slice().sort((a, b) => toMonthly(b.cost, b.cycle) - toMonthly(a.cost, a.cycle));
    animateValue(document.getElementById('anaMostExpensive'), toMonthly(sorted[0].cost, sorted[0].cycle), true);
    document.getElementById('anaMostExpensiveSub').textContent = sorted[0].name;

    const catTotals = {};
    subs.forEach(s => {
        catTotals[s.category] = (catTotals[s.category] || 0) + toMonthly(s.cost, s.cycle);
    });
    const catArr = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    const topCat = catArr[0];
    document.getElementById('anaTopCat').textContent    = topCat[0];
    document.getElementById('anaTopCatSub').textContent = `$${topCat[1].toFixed(2)}/mo`;

    document.getElementById('catBreakdown').innerHTML = catArr.map(([cat, amt]) => {
        const pct   = monthly > 0 ? (amt / monthly * 100) : 0;
        const color = CAT_COLORS[cat] || '#94a3b8';
        return `
            <div class="cat-row">
                <div class="cat-dot" style="background:${color}"></div>
                <div class="cat-bar-wrap">
                    <div class="cat-bar-label">
                        <span>${cat}</span>
                        <span>$${amt.toFixed(2)}/mo · ${pct.toFixed(0)}%</span>
                    </div>
                    <div class="cat-bar-track">
                        <div class="cat-bar-fill" style="width:${pct}%;background:${color}"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderUpcoming() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const in30 = new Date(now.getTime() + 30 * 86400000);

    const upcoming = subs.filter(s => {
        const d = new Date(s.renewalDate + 'T00:00:00');
        return d >= now && d <= in30;
    }).sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));

    document.getElementById('upcomingCountBadge').textContent = `${upcoming.length} renewal${upcoming.length !== 1 ? 's' : ''}`;

    const list = document.getElementById('upcomingPageList');
    list.innerHTML = upcoming.length === 0
        ? emptyState('empty_ok', 'All clear!', 'No renewals in the next 30 days.')
        : upcoming.map(s => renderSubItem(s, true)).join('');
}
