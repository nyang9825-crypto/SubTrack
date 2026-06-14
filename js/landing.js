/* ─ Landing page interactivity ─ */

/* ── Calculator ── */
function calcUpdate() {
    const count = parseInt(document.getElementById('calcCount').value, 10);
    const cost  = parseInt(document.getElementById('calcCost').value, 10);
    const waste = Math.min(parseInt(document.getElementById('calcWaste').value, 10), count);

    document.getElementById('calcCountVal').textContent = count;
    document.getElementById('calcCostVal').textContent  = cost;
    document.getElementById('calcWasteVal').textContent = waste;

    // Sync slider fill via CSS custom property
    ['calcCount','calcCost','calcWaste'].forEach(id => {
        const el  = document.getElementById(id);
        const min = parseInt(el.min, 10);
        const max = parseInt(el.max, 10);
        const pct = ((parseInt(el.value, 10) - min) / (max - min)) * 100;
        el.style.setProperty('--val', pct + '%');
    });

    const monthly    = count * cost;
    const annual     = monthly * 12;
    const wastedAmt  = waste * cost * 12;

    document.getElementById('calcMonthly').textContent   = '$' + monthly.toFixed(2);
    document.getElementById('calcAnnual').textContent    = '$' + annual.toLocaleString();
    document.getElementById('calcWastedAmt').textContent = '$' + wastedAmt.toLocaleString();
    document.getElementById('calcSavings').textContent   = '$' + wastedAmt.toLocaleString();
}

/* ── Scroll-triggered counter animations ── */
function animateCounter(el, target, duration) {
    const start = performance.now();
    const tick  = (now) => {
        const p      = Math.min((now - start) / duration, 1);
        const eased  = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target);
        if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

function initCounters() {
    const counters = document.querySelectorAll('.js-counter');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.animated) {
                entry.target.dataset.animated = '1';
                animateCounter(
                    entry.target,
                    parseInt(entry.target.dataset.target, 10),
                    900
                );
            }
        });
    }, { threshold: 0.3 });

    counters.forEach(c => observer.observe(c));
}

/* ── Sticky nav shadow on scroll ── */
function initNavScroll() {
    const nav = document.querySelector('.land-nav');
    if (!nav) return;
    window.addEventListener('scroll', () => {
        nav.style.background = window.scrollY > 20
            ? 'rgba(5,46,22,0.97)'
            : 'rgba(5,46,22,0.92)';
    }, { passive: true });
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
    calcUpdate();
    initCounters();
    initNavScroll();
});
