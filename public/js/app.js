// Main Application Controller & Orchestrator for PBL OS Visualizer

document.addEventListener('DOMContentLoaded', () => {
  // Theme Management (Dark & Light Theme)
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const storedTheme = localStorage.getItem('os_theme') || 
    (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  
  setTheme(storedTheme);

  themeToggleBtn?.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  });

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('os_theme', theme);
    if (themeToggleBtn) {
      themeToggleBtn.innerHTML = theme === 'dark' ? '🌙' : '☀️';
      themeToggleBtn.title = `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`;
    }
  }

  // Main Tab Navigation Handling
  const mainTabs = document.querySelectorAll('.nav-tab-btn');
  const tabPanels = document.querySelectorAll('.tab-content');

  function switchMainTab(tabId) {
    mainTabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === tabId));
    tabPanels.forEach(p => p.classList.toggle('active', p.id === `tab-${tabId}`));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  mainTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchMainTab(tabId);
    });
  });

  // Quick Jump CTA buttons on Overview Dashboard
  document.querySelectorAll('[data-jump-tab]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = el.getAttribute('data-jump-tab');
      const subtab = el.getAttribute('data-jump-subtab');
      switchMainTab(tab);
      if (subtab) {
        if (tab === 'sync') switchSyncSubtab(subtab);
        if (tab === 'memory') switchMemSubtab(subtab);
      }
    });
  });

  // Process Synchronization Sub-tabs
  const syncSubBtns = document.querySelectorAll('#tab-sync .subnav-btn');
  const syncSubPanels = document.querySelectorAll('#tab-sync .subtab-content');

  function switchSyncSubtab(subtabId) {
    syncSubBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-subtab') === subtabId));
    syncSubPanels.forEach(p => p.classList.toggle('active', p.id === `sync-${subtabId}`));
  }

  syncSubBtns.forEach(b => {
    b.addEventListener('click', () => switchSyncSubtab(b.getAttribute('data-subtab')));
  });

  // Memory Management Sub-tabs
  const memSubBtns = document.querySelectorAll('#tab-memory .subnav-btn');
  const memSubPanels = document.querySelectorAll('#tab-memory .subtab-content');

  function switchMemSubtab(subtabId) {
    memSubBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-subtab') === subtabId));
    memSubPanels.forEach(p => p.classList.toggle('active', p.id === `mem-${subtabId}`));
  }

  memSubBtns.forEach(b => {
    b.addEventListener('click', () => switchMemSubtab(b.getAttribute('data-subtab')));
  });

  // Instantiate Interactive Simulations
  window.pcSim = new ProducerConsumerSim();
  window.rwSim = new ReadersWritersSim();
  window.dpSim = new DiningPhilosophersSim();
  window.sbSim = new SleepingBarberSim();

  window.contigSim = new ContiguousMemorySim();
  window.pagingSim = new PagingSim();
  window.segSim = new SegmentationSim();
  window.fragSim = new FragmentationSim();
  window.prSim = new PageReplacementSim();
});
