function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${id}`).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(n => {
        const attr = n.getAttribute('onclick') || '';
        n.classList.toggle('active', attr.includes(`'${id}'`));
    });
    document.querySelectorAll('.mobile-nav-item').forEach(n => {
        const attr = n.getAttribute('onclick') || '';
        n.classList.toggle('active', attr.includes(`'${id}'`));
    });

    if (id === 'home')          { renderHomePage(); }
    else if (id === 'spending') { renderBudgetWidget(); renderSpendingPage(); }
    else if (id === 'trips')    { renderTripsPage(); }
    else renderAll();
}

function setGreeting() {
    const h = new Date().getHours();
    const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    document.getElementById('greetingText').textContent = `${greet} 👋`;
}
