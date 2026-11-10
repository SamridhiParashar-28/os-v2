// Producer-Consumer Problem Simulation
class ProducerConsumerSim {
  constructor() {
    this.bufferSize = 6;
    this.buffer = new Array(this.bufferSize).fill(null);
    this.in = 0;
    this.out = 0;
    this.itemCounter = 1;

    // Semaphores
    this.mutex = 1;
    this.empty = this.bufferSize;
    this.full = 0;

    // State machine & timing
    this.isPlaying = false;
    this.speedMultiplier = 1;
    this.timer = null;
    this.stepIndex = 0;
    this.activeActor = null; // 'producer' or 'consumer'
    this.currentPhase = 'idle'; // produce, wait_empty, wait_mutex, insert, signal_mutex, signal_full, wait_full, wait_mutex_c, remove, signal_mutex_c, signal_empty, consume
    this.queue = []; // pending actions

    this.initDOM();
  }

  initDOM() {
    this.dom = {
      bufferSlots: document.getElementById('pc-buffer-slots'),
      semMutex: document.getElementById('sem-pc-mutex'),
      semEmpty: document.getElementById('sem-pc-empty'),
      semFull: document.getElementById('sem-pc-full'),
      csZone: document.getElementById('pc-cs-zone'),
      csStateBadge: document.getElementById('pc-cs-badge'),
      producerNode: document.getElementById('pc-producer-node'),
      consumerNode: document.getElementById('pc-consumer-node'),
      logBox: document.getElementById('pc-log-box'),
      codeContainer: document.getElementById('pc-code-container'),
      btnPlayPause: document.getElementById('pc-btn-play'),
      btnStep: document.getElementById('pc-btn-step'),
      btnReset: document.getElementById('pc-btn-reset'),
      btnProduce: document.getElementById('pc-btn-produce'),
      btnConsume: document.getElementById('pc-btn-consume'),
      speedSlider: document.getElementById('pc-speed')
    };

    this.renderBuffer();
    this.renderCode();
    this.updateSemaphores();
    this.bindEvents();
    this.log('Simulation initialized. Buffer size = ' + this.bufferSize + ', Mutex = 1, Empty = ' + this.bufferSize + ', Full = 0.');
  }

  renderCode() {
    if (!this.dom.codeContainer) return;
    const data = window.OS_PSEUDOCODE.producerConsumer;
    this.dom.codeContainer.innerHTML = data.code.map(item => `
      <div class="code-line" id="pc-line-${item.line}" data-phase="${item.phase || ''}">
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

  bindEvents() {
    this.dom.btnPlayPause?.addEventListener('click', () => this.togglePlay());
    this.dom.btnStep?.addEventListener('click', () => this.step());
    this.dom.btnReset?.addEventListener('click', () => this.reset());
    this.dom.btnProduce?.addEventListener('click', () => this.manualAction('produce'));
    this.dom.btnConsume?.addEventListener('click', () => this.manualAction('consume'));
    this.dom.speedSlider?.addEventListener('input', (e) => {
      this.speedMultiplier = parseFloat(e.target.value);
      if (this.isPlaying) {
        this.stopAutoPlay();
        this.startAutoPlay();
      }
    });
  }

  renderBuffer() {
    if (!this.dom.bufferSlots) return;
    this.dom.bufferSlots.innerHTML = this.buffer.map((item, idx) => {
      const isFilled = item !== null;
      const isPIn = idx === this.in;
      const isCOut = idx === this.out;
      return `
        <div class="buffer-slot ${isFilled ? 'filled' : ''}" title="Index ${idx}">
          ${isFilled ? `📦 #${item}` : `Slot ${idx}`}
          ${isPIn ? '<span style="position:absolute; bottom:-16px; font-size:9px; color:var(--teal-400);">IN</span>' : ''}
          ${isCOut ? '<span style="position:absolute; top:-16px; font-size:9px; color:var(--color-warning);">OUT</span>' : ''}
        </div>
      `;
    }).join('');
  }

  updateSemaphores() {
    if (this.dom.semMutex) this.dom.semMutex.textContent = this.mutex;
    if (this.dom.semEmpty) this.dom.semEmpty.textContent = this.empty;
    if (this.dom.semFull) this.dom.semFull.textContent = this.full;
  }

  log(text, type = 'normal') {
    if (!this.dom.logBox) return;
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-text ${type}">${text}</span>`;
    this.dom.logBox.prepend(entry);
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
    const interval = Math.max(500, 1500 / this.speedMultiplier);
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

  manualAction(type) {
    this.queue.push(type);
    this.step();
  }

  step() {
    // Determine action: either from queue or alternating producer/consumer
    let action = this.queue.shift();
    if (!action) {
      // Auto generator: weighted randomized choice
      if (this.full === 0) action = 'produce';
      else if (this.empty === 0) action = 'consume';
      else action = Math.random() > 0.45 ? 'produce' : 'consume';
    }

    if (action === 'produce') {
      this.executeProducerStep();
    } else {
      this.executeConsumerStep();
    }
  }

  executeProducerStep() {
    this.activeActor = 'producer';
    if (this.empty === 0) {
      this.log('Producer BLOCKED: Buffer is FULL (empty = 0). Producer must wait on signal(empty).', 'warn');
      this.highlightLine('wait_empty');
      if (this.dom.producerNode) {
        this.dom.producerNode.className = 'actor-node waiting';
        this.dom.producerNode.innerHTML = `<strong>Producer</strong><br><small style="color:var(--color-warning);">Blocked (Buffer Full)</small>`;
      }
      return;
    }

    // Produce item
    const newItem = this.itemCounter++;
    this.empty--;
    this.mutex--; // Enters critical section
    this.updateSemaphores();

    this.log(`Producer produced Item #${newItem}. Acquired mutex. Entering Critical Section.`, 'highlight');
    this.highlightLine('insert');

    // Visual CS locked
    if (this.dom.csZone) this.dom.csZone.className = 'cs-zone occupied';
    if (this.dom.csStateBadge) this.dom.csStateBadge.innerHTML = `<span style="color:var(--color-danger);">● LOCKED: Producer in CS</span>`;
    if (this.dom.producerNode) {
      this.dom.producerNode.className = 'actor-node working';
      this.dom.producerNode.innerHTML = `<strong>Producer</strong><br><small style="color:var(--teal-400);">Writing Item #${newItem} to slot ${this.in}</small>`;
    }

    // Place into buffer
    this.buffer[this.in] = newItem;
    this.in = (this.in + 1) % this.bufferSize;
    this.renderBuffer();

    // Release CS after brief delay
    setTimeout(() => {
      this.mutex++;
      this.full++;
      this.updateSemaphores();
      this.highlightLine('signal_full');
      this.log(`Producer released mutex & signaled full (${this.full} items available).`, 'success');

      if (this.dom.csZone) this.dom.csZone.className = 'cs-zone free';
      if (this.dom.csStateBadge) this.dom.csStateBadge.innerHTML = `<span style="color:var(--color-success);">● UNLOCKED: Critical Section Free</span>`;
      if (this.dom.producerNode) {
        this.dom.producerNode.className = 'actor-node';
        this.dom.producerNode.innerHTML = `<strong>Producer</strong><br><small>Idle / Ready</small>`;
      }
    }, 400 / this.speedMultiplier);
  }

  executeConsumerStep() {
    this.activeActor = 'consumer';
    if (this.full === 0) {
      this.log('Consumer BLOCKED: Buffer is EMPTY (full = 0). Consumer must wait on signal(full).', 'warn');
      this.highlightLine('wait_full');
      if (this.dom.consumerNode) {
        this.dom.consumerNode.className = 'actor-node waiting';
        this.dom.consumerNode.innerHTML = `<strong>Consumer</strong><br><small style="color:var(--color-warning);">Blocked (Buffer Empty)</small>`;
      }
      return;
    }

    this.full--;
    this.mutex--; // Enter CS
    this.updateSemaphores();

    const consumedItem = this.buffer[this.out];
    this.log(`Consumer acquired mutex. Entering Critical Section to fetch item #${consumedItem} from slot ${this.out}.`, 'highlight');
    this.highlightLine('remove');

    // Visual CS locked
    if (this.dom.csZone) this.dom.csZone.className = 'cs-zone occupied';
    if (this.dom.csStateBadge) this.dom.csStateBadge.innerHTML = `<span style="color:var(--color-danger);">● LOCKED: Consumer in CS</span>`;
    if (this.dom.consumerNode) {
      this.dom.consumerNode.className = 'actor-node working';
      this.dom.consumerNode.innerHTML = `<strong>Consumer</strong><br><small style="color:var(--color-warning);">Consuming Item #${consumedItem}</small>`;
    }

    this.buffer[this.out] = null;
    this.out = (this.out + 1) % this.bufferSize;
    this.renderBuffer();

    setTimeout(() => {
      this.mutex++;
      this.empty++;
      this.updateSemaphores();
      this.highlightLine('signal_empty');
      this.log(`Consumer consumed Item #${consumedItem}. Released mutex and signaled empty (${this.empty} slots free).`, 'success');

      if (this.dom.csZone) this.dom.csZone.className = 'cs-zone free';
      if (this.dom.csStateBadge) this.dom.csStateBadge.innerHTML = `<span style="color:var(--color-success);">● UNLOCKED: Critical Section Free</span>`;
      if (this.dom.consumerNode) {
        this.dom.consumerNode.className = 'actor-node';
        this.dom.consumerNode.innerHTML = `<strong>Consumer</strong><br><small>Idle / Ready</small>`;
      }
    }, 400 / this.speedMultiplier);
  }

  reset() {
    this.stopAutoPlay();
    this.buffer = new Array(this.bufferSize).fill(null);
    this.in = 0;
    this.out = 0;
    this.itemCounter = 1;
    this.mutex = 1;
    this.empty = this.bufferSize;
    this.full = 0;
    this.queue = [];
    this.renderBuffer();
    this.updateSemaphores();
    this.highlightLine(null);
    if (this.dom.csZone) this.dom.csZone.className = 'cs-zone free';
    if (this.dom.csStateBadge) this.dom.csStateBadge.innerHTML = `<span style="color:var(--color-success);">● UNLOCKED: Critical Section Free</span>`;
    if (this.dom.producerNode) this.dom.producerNode.innerHTML = `<strong>Producer</strong><br><small>Ready</small>`;
    if (this.dom.consumerNode) this.dom.consumerNode.innerHTML = `<strong>Consumer</strong><br><small>Ready</small>`;
    this.log('Simulation reset to initial state.', 'highlight');
  }
}

window.ProducerConsumerSim = ProducerConsumerSim;

