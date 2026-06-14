window.addEventListener('load', () => {
    subs      = loadSubs();
    spendings = loadSpendings();
    setGreeting();
    initGmailUI();
    renderAll();
    renderBudgetWidget();
});
