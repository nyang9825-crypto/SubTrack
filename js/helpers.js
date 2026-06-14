function toMonthly(cost, cycle) {
    if (cycle === 'yearly') return cost / 12;
    if (cycle === 'weekly') return cost * 4.33;
    return cost;
}

function totalMonthly() {
    return subs.reduce((s, sub) => s + toMonthly(sub.cost, sub.cycle), 0);
}

function daysUntil(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(dateStr + 'T00:00:00');
    return Math.ceil((d - today) / 86400000);
}

function daysPill(days) {
    if (days < 0)   return `<span class="days-pill past">Expired ${Math.abs(days)}d ago</span>`;
    if (days === 0) return `<span class="days-pill urgent">Today!</span>`;
    if (days <= 3)  return `<span class="days-pill urgent">In ${days} day${days === 1 ? '' : 's'}</span>`;
    if (days <= 14) return `<span class="days-pill soon">In ${days} days</span>`;
    return `<span class="days-pill ok">In ${days} days</span>`;
}

function cycleLabel(cycle) {
    return cycle === 'yearly' ? '/yr' : cycle === 'weekly' ? '/wk' : '/mo';
}

function subBgColor(category) {
    const colors = {
        'Entertainment':    '#eff6ff',
        'Music':            '#faf5ff',
        'Software':         '#f0f9ff',
        'Gaming':           '#fff7ed',
        'News & Reading':   '#f7fee7',
        'Health & Fitness': '#f0fdf4',
        'Cloud Storage':    '#ecfeff',
        'Finance':          '#fffbeb',
        'Shopping':         '#fdf2f8',
        'Other':            '#f8fafc',
    };
    return colors[category] || '#f8fafc';
}

function escHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function animateValue(el, to, isCurrency = true, duration = 600) {
    if (!el) return;
    const from = parseFloat(el.textContent) || 0;
    if (from === to) { el.textContent = isCurrency ? to.toFixed(2) : to; return; }
    const start = performance.now();
    const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const cur = from + (to - from) * eased;
        el.textContent = isCurrency ? cur.toFixed(2) : Math.round(cur);
        if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

function letterAvatar(sub) {
    const color  = CAT_COLORS[sub.category] || '#6b7280';
    const letter = (sub.name || '?')[0].toUpperCase();
    return `<div class="sub-emoji letter-avatar" style="background:${color}18;border-color:${color}30;color:${color}">${letter}</div>`;
}

function onSubLogoError(img) {
    const color = img.dataset.color;
    const letter = img.dataset.letter;
    img.parentElement.outerHTML = `<div class="sub-emoji letter-avatar" style="background:${color}18;border-color:${color}30;color:${color}">${letter}</div>`;
}

function subIconHTML(sub) {
    const logo = BRAND_LOGOS[sub.name];
    const bg   = subBgColor(sub.category);
    if (!logo) return letterAvatar(sub);
    const color  = CAT_COLORS[sub.category] || '#6b7280';
    const letter = (sub.name || '?')[0].toUpperCase();
    return `<div class="sub-emoji sub-logo" style="background:${bg}">` +
        `<img src="${logo}" alt="${escHtml(sub.name)}" class="brand-logo" data-color="${color}" data-letter="${letter}"` +
        ` onerror="onSubLogoError(this)" /></div>`;
}

// Swipe-down to dismiss a bottom-sheet or modal panel
function addSwipeClose(el, closeFn, threshold = 100) {
    if (!el) return;
    let startY = 0, curY = 0;
    el.addEventListener('touchstart', e => {
        startY = curY = e.touches[0].clientY;
        el.style.transition = 'none';
    }, { passive: true });
    el.addEventListener('touchmove', e => {
        curY = e.touches[0].clientY;
        const dy = Math.max(0, curY - startY);
        el.style.transform = `translateY(${dy}px)`;
    }, { passive: true });
    el.addEventListener('touchend', () => {
        const dy = curY - startY;
        el.style.transition = 'transform 0.28s cubic-bezier(0.4,0,0.2,1)';
        if (dy > threshold) {
            el.style.transform = `translateY(110%)`;
            setTimeout(() => { closeFn(); el.style.transform = ''; el.style.transition = ''; }, 260);
        } else {
            el.style.transform = '';
            setTimeout(() => { el.style.transition = ''; }, 300);
        }
    });
}

function renderSubItem(sub, showDays = false) {
    const days = daysUntil(sub.renewalDate);
    const monthly = toMonthly(sub.cost, sub.cycle);
    const urgentClass = days >= 0 && days <= 3 ? ' sub-item-urgent' : '';
    return `
        <div class="sub-item${urgentClass}">
            ${subIconHTML(sub)}
            <div class="sub-info">
                <div class="sub-name">${escHtml(sub.name)}</div>
                <div class="sub-meta">${sub.category} · Renews ${new Date(sub.renewalDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                ${sub.notes ? `<div class="sub-meta" style="color:#94a3b8">${escHtml(sub.notes)}</div>` : ''}
            </div>
            <div class="sub-right">
                ${showDays ? daysPill(days) : ''}
                <div class="sub-cost">
                    <div class="sub-cost-main">$${sub.cost.toFixed(2)}<span style="font-size:12px;font-weight:500;color:var(--muted)">${cycleLabel(sub.cycle)}</span></div>
                    ${sub.cycle !== 'monthly' ? `<div class="sub-cost-cycle">$${monthly.toFixed(2)}/mo equiv.</div>` : ''}
                </div>
                <button class="icon-btn edit" onclick="openModal(${sub.id})" title="Edit">${ICONS.edit}</button>
                <button class="icon-btn delete" onclick="deleteSub(${sub.id})" title="Delete">${ICONS.trash}</button>
            </div>
        </div>
    `;
}
