// Sleeping Barber Problem Simulation
class SleepingBarberSim {
  constructor() {
    this.numChairs = 4;
    this.waitingCount = 0;
    this.waitingQueue = []; // array of customer IDs

    // Semaphores
    this.customers = 0;
    this.barber = 0;
    this.mutex = 1;

    this.barberState = 'sleeping'; // 'sleeping', 'cutting'
    this.activeCustomer = null;
    this.customerIdCounter = 1;

    this.isPlaying = false;
    this.speedMultiplier = 1;
    this.timer = null;

    this.initDOM();
  }

  initDOM() {
    this.dom = {
      semCustomers: document.getElementById('sem-sb-customers'),
      semBarber: document.getElementById('sem-sb-barber'),
      semMutex: document.getElementById('sem-sb-mutex'),
      barberChairZone: document.getElementById('sb-barber-chair-zone'),
      waitingChairsBox: document.getElementById('sb-waiting-chairs'),
      statusBadge: document.getElementById('sb-status-badge'),
      logBox: document.getElementById('sb-log-box'),
      codeContainer: document.getElementById('sb-code-container'),
      btnPlayPause: document.getElementById('sb-btn-play'),
      btnStep: document.getElementById('sb-btn-step'),
      btnReset: document.getElementById('sb-btn-reset'),
      btnAddCustomer: document.getElementById('sb-btn-add-customer'),
      speedSlider: document.getElementById('sb-speed')
    };

    this.renderCode();
    this.renderWaitingChairs();
    this.updateUI();
    this.bindEvents();
    this.log('Sleeping Barber simulation initialized. 4 Waiting Chairs. Barber is currently sleeping.');
  }

  renderCode() {
    if (!this.dom.codeContainer) return;
    const data = window.OS_PSEUDOCODE.sleepingBarber;
    this.dom.codeContainer.innerHTML = data.code.map(item => `
      <div class="code-line" id="sb-line-${item.line}" data-phase="${item.phase || ''}">
        <span class="code-line-num">${item.line}</span>
        <span class="code-line-text">${this.escapeHtml(item.text)}</span>
      </div>
    `).join('');
  }

  escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  highlightLine(phase) {
    if (!this.dom.codeContainer) return;
    const lines = this.dom.codeContainer.querySelectorAll('.code-line');
    lines.forEach(l => l.classList.remove('active-line'));
    if (!phase) return;
    const target = this.dom.codeContainer.querySelector(`[data-phase="${phase}"]`);
    if (target) {
      target.classList.add('active-line');
      target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  renderWaitingChairs() {
    if (!this.dom.waitingChairsBox) return;
    let html = '';
    for (let i = 0; i < this.numChairs; i++) {
      const customer = this.waitingQueue[i];
      const isOccupied = !!customer;
      html += `
        <div class="waiting-chair ${isOccupied ? 'occupied' : ''}" id="sb-chair-${i}">
          <span>🪑 Chair ${i + 1}</span>
          <span style="font-size:11px;">${isOccupied ? `👤 Customer #${customer}` : '<em style="color:var(--text-muted)">Empty</em>'}</span>
        </div>
      `;
    }
    this.dom.waitingChairsBox.innerHTML = html;
  }

  bindEvents() {
    this.dom.btnPlayPause?.addEventListener('click', () => this.togglePlay());
    this.dom.btnStep?.addEventListener('click', () => this.step());
    this.dom.btnReset?.addEventListener('click', () => this.reset());
    this.dom.btnAddCustomer?.addEventListener('click', () => this.addCustomer());
    this.dom.speedSlider?.addEventListener('input', (e) => {
      this.speedMultiplier = parseFloat(e.target.value);
      if (this.isPlaying) {
        this.stopAutoPlay();
        this.startAutoPlay();
      }
    });
  }

  log(text, type = 'normal') {
    if (!this.dom.logBox) return;
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-text ${type}">${text}</span>`;
    this.dom.logBox.prepend(entry);
  }

  updateUI() {
    if (this.dom.semCustomers) this.dom.semCustomers.textContent = this.customers;
    if (this.dom.semBarber) this.dom.semBarber.textContent = this.barber;
    if (this.dom.semMutex) this.dom.semMutex.textContent = this.mutex;

    // Barber chair update
    if (this.dom.barberChairZone) {
      if (this.barberState === 'cutting') {
        this.dom.barberChairZone.className = 'barber-chair-zone cutting';
        this.dom.barberChairZone.innerHTML = `
          <div style="font-size:2rem">✂️💈</div>
          <strong>Barber: Cutting Hair</strong>
          <small style="color:var(--teal-400);">Customer #${this.activeCustomer}</small>
        `;
      } else {
        this.dom.barberChairZone.className = 'barber-chair-zone sleeping';
        this.dom.barberChairZone.innerHTML = `
          <div style="font-size:2rem">😴💤</div>
          <strong>Barber: Sleeping</strong>
          <small style="color:var(--text-muted);">Waiting for customers</small>
        `;
      }
    }

    this.renderWaitingChairs();

    // Status Badge
    if (this.dom.statusBadge) {
      if (this.barberState === 'cutting') {
        this.dom.statusBadge.innerHTML = `<span style="color:var(--teal-400);">● BUSY: Haircut in progress (${this.waitingQueue.length} in waiting room)</span>`;
      } else {
        this.dom.statusBadge.innerHTML = `<span style="color:var(--color-purple);">● ASLEEP: No waiting customers</span>`;
      }
    }
  }

  addCustomer() {
    const id = this.customerIdCounter++;
    this.highlightLine('check_chairs');

    if (this.barberState === 'sleeping') {
      // Wakes barber directly!
      this.activeCustomer = id;
      this.barberState = 'cutting';
      this.barber = 1;
      this.customers = 0;
      this.highlightLine('wake_barber');
      this.log(`Customer #${id} arrives, finds Barber asleep, wakes Barber, and sits in Barber Chair!`, 'highlight');
    } else {
      // Barber is busy: check waiting room chairs
      if (this.waitingQueue.length < this.numChairs) {
        this.waitingQueue.push(id);
        this.waitingCount = this.waitingQueue.length;
        this.customers = this.waitingCount;
        this.log(`Customer #${id} arrives: Barber is busy. Customer sits in waiting chair #${this.waitingCount}.`, 'normal');
      } else {
        // Shop is full! Customer balks / leaves
        this.highlightLine('leave');
        this.log(`Customer #${id} arrives: All ${this.numChairs} waiting chairs are FULL! Customer leaves (Balking).`, 'danger');
      }
    }

    this.updateUI();
  }

  step() {
    // 1. If barber is cutting hair, finish haircut
    if (this.barberState === 'cutting') {
      const finishedCust = this.activeCustomer;
      this.activeCustomer = null;
      this.log(`Barber finished haircut for Customer #${finishedCust}.`, 'success');

      // Check if another customer is waiting in chairs
      if (this.waitingQueue.length > 0) {
        const nextCust = this.waitingQueue.shift();
        this.waitingCount = this.waitingQueue.length;
        this.customers = this.waitingCount;
        this.activeCustomer = nextCust;
        this.barberState = 'cutting';
        this.barber = 1;
        this.highlightLine('barber_seat');
        this.log(`Customer #${nextCust} moves from waiting chair to Barber Chair. Barber starts cutting.`, 'highlight');
      } else {
        // No customers waiting: barber goes to sleep!
        this.barberState = 'sleeping';
        this.barber = 0;
        this.customers = 0;
        this.highlightLine('barber_sleep');
        this.log(`No customers left in waiting room. Barber falls asleep. 💤`, 'normal');
      }
      this.updateUI();
      return;
    }

    // 2. If barber is asleep, generate an arriving customer
    this.addCustomer();
  }

  togglePlay() {
    if (this.isPlaying) {
      this.stopAutoPlay();
    } else {
      this.startAutoPlay();
    }
  }

  startAutoPlay() {
    this.isPlaying = true;
    if (this.dom.btnPlayPause) this.dom.btnPlayPause.innerHTML = '⏸ Pause';
    const interval = Math.max(700, 1800 / this.speedMultiplier);
    this.timer = setInterval(() => this.step(), interval);
  }

  stopAutoPlay() {
    this.isPlaying = false;
    if (this.dom.btnPlayPause) this.dom.btnPlayPause.innerHTML = '▶ Auto Play';
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  reset() {
    this.stopAutoPlay();
    this.waitingCount = 0;
    this.waitingQueue = [];
    this.customers = 0;
    this.barber = 0;
    this.mutex = 1;
    this.barberState = 'sleeping';
    this.activeCustomer = null;
    this.customerIdCounter = 1;
    this.updateUI();
    this.highlightLine(null);
    this.log('Sleeping Barber simulation reset to initial state.', 'highlight');
  }
}

window.SleepingBarberSim = SleepingBarberSim;

