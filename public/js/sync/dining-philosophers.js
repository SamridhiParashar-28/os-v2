// Dining Philosophers Problem Simulation
class DiningPhilosophersSim {
  constructor() {
    this.numPhilosophers = 5;
    // States: 'thinking', 'hungry', 'eating'
    this.philosophers = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      state: 'thinking',
      leftChopstick: i,
      rightChopstick: (i + 1) % 5,
      eatDuration: 0
    }));

    // Chopsticks semaphores: 1 = available, 0 = taken
    this.chopsticks = [1, 1, 1, 1, 1];
    this.chopstickOwners = [null, null, null, null, null]; // who holds it

    this.isPlaying = false;
    this.speedMultiplier = 1;
    this.timer = null;

    this.initDOM();
  }

  initDOM() {
    this.dom = {
      tableArena: document.getElementById('dp-arena'),
      statusBadge: document.getElementById('dp-status-badge'),
      chopstickBadges: [0, 1, 2, 3, 4].map(i => document.getElementById(`sem-dp-chop-${i}`)),
      logBox: document.getElementById('dp-log-box'),
      codeContainer: document.getElementById('dp-code-container'),
      btnPlayPause: document.getElementById('dp-btn-play'),
      btnStep: document.getElementById('dp-btn-step'),
      btnReset: document.getElementById('dp-btn-reset'),
      btnDeadlock: document.getElementById('dp-btn-deadlock'),
      speedSlider: document.getElementById('dp-speed'),

      // Enhanced Visual Elements
      narrativeBox: document.getElementById('dp-narrative-box'),
      narrativeTitle: document.getElementById('dp-narrative-title'),
      narrativeText: document.getElementById('dp-narrative-text'),
      narrativeIcon: document.getElementById('dp-narrative-icon'),
      deadlockBanner: document.getElementById('dp-deadlock-banner'),
      chopstickTags: [0, 1, 2, 3, 4].map(i => document.getElementById(`dp-chop-tag-${i}`))
    };

    this.renderCircle();
    this.renderCode();
    this.updateUI();
    this.bindEvents();
    this.log('Dining Philosophers simulation initialized. 5 Philosophers, 5 Chopsticks.');
  }

  setNarrative(icon, title, text, stateClass = '') {
    if (this.dom.narrativeIcon) this.dom.narrativeIcon.textContent = icon;
    if (this.dom.narrativeTitle) this.dom.narrativeTitle.textContent = title;
    if (this.dom.narrativeText) this.dom.narrativeText.textContent = text;
    if (this.dom.narrativeBox) {
      this.dom.narrativeBox.className = 'sync-narrative-box ' + stateClass;
    }
  }

  renderCode() {
    if (!this.dom.codeContainer) return;
    const data = window.OS_PSEUDOCODE.diningPhilosophers;
    this.dom.codeContainer.innerHTML = data.code.map(item => `
      <div class="code-line" id="dp-line-${item.line}" data-phase="${item.phase || ''}">
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

  renderCircle() {
    if (!this.dom.tableArena) return;
    this.dom.tableArena.innerHTML = `
      <div class="dining-table">
        <div class="spaghetti-bowl">🍝</div>
      </div>
    `;

    const arenaRadius = 135;
    const chopstickRadius = 85;

    // Render 5 Philosophers
    for (let i = 0; i < 5; i++) {
      const angle = (i * 72 - 90) * (Math.PI / 180);
      const x = Math.round(190 + arenaRadius * Math.cos(angle) - 34);
      const y = Math.round(190 + arenaRadius * Math.sin(angle) - 34);

      const seat = document.createElement('div');
      seat.id = `dp-seat-${i}`;
      seat.className = 'philosopher-seat thinking';
      seat.style.left = `${x}px`;
      seat.style.top = `${y}px`;
      seat.innerHTML = `<span>🧠 P${i}</span><small style="font-size:9px">Thinking</small>`;
      seat.title = `Click to make Philosopher ${i} hungry!`;
      seat.addEventListener('click', () => this.makePhilosopherHungry(i));
      this.dom.tableArena.appendChild(seat);
    }

    // Render 5 Chopsticks between philosophers
    for (let i = 0; i < 5; i++) {
      const angle = (i * 72 - 54) * (Math.PI / 180);
      const x = Math.round(190 + chopstickRadius * Math.cos(angle) - 10);
      const y = Math.round(190 + chopstickRadius * Math.sin(angle) - 10);

      const chop = document.createElement('div');
      chop.id = `dp-chop-${i}`;
      chop.className = 'chopstick-node';
      chop.style.left = `${x}px`;
      chop.style.top = `${y}px`;
      chop.innerHTML = `🥢<sub style="font-size:9px;font-weight:700">C${i}</sub>`;
      this.dom.tableArena.appendChild(chop);
    }
  }

  bindEvents() {
    this.dom.btnPlayPause?.addEventListener('click', () => this.togglePlay());
    this.dom.btnStep?.addEventListener('click', () => this.step());
    this.dom.btnReset?.addEventListener('click', () => this.reset());
    this.dom.btnDeadlock?.addEventListener('click', () => this.triggerDeadlockScenario());
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
    const deadlocked = this.isDeadlocked();

    // Update Chopstick Semaphores & Ownership Tags
    for (let i = 0; i < 5; i++) {
      if (this.dom.chopstickBadges[i]) {
        this.dom.chopstickBadges[i].textContent = this.chopsticks[i];
      }
      const chopEl = document.getElementById(`dp-chop-${i}`);
      if (chopEl) {
        if (this.chopsticks[i] === 0) {
          chopEl.classList.add('taken');
        } else {
          chopEl.classList.remove('taken');
        }
      }

      if (this.dom.chopstickTags[i]) {
        if (deadlocked) {
          this.dom.chopstickTags[i].className = 'chopstick-owner-tag deadlocked';
          this.dom.chopstickTags[i].innerHTML = `🥢 C${i}: <strong style="color:var(--color-danger);">Held by P${i} (Blocked)</strong>`;
        } else if (this.chopsticks[i] === 0) {
          const owner = this.chopstickOwners[i];
          this.dom.chopstickTags[i].className = 'chopstick-owner-tag held';
          this.dom.chopstickTags[i].innerHTML = `🥢 C${i}: <strong style="color:var(--teal-400);">Held by P${owner !== null ? owner : '?'}</strong>`;
        } else {
          this.dom.chopstickTags[i].className = 'chopstick-owner-tag';
          this.dom.chopstickTags[i].innerHTML = `🥢 C${i}: <span style="color:var(--text-muted);">Free</span>`;
        }
      }
    }

    // Update Philosophers
    let eatingPhilosophers = [];
    for (let i = 0; i < 5; i++) {
      const p = this.philosophers[i];
      const seat = document.getElementById(`dp-seat-${i}`);
      if (seat) {
        seat.className = `philosopher-seat ${p.state}`;
        const icon = p.state === 'eating' ? '😋' : p.state === 'hungry' ? '🤤' : '🧠';
        const label = p.state === 'eating' ? 'Eating' : p.state === 'hungry' ? 'Hungry' : 'Thinking';
        seat.innerHTML = `<span>${icon} P${i}</span><small style="font-size:9px">${label}</small>`;
      }
      if (p.state === 'eating') eatingPhilosophers.push(i);
    }

    // Status Badge & Narrative
    if (this.dom.statusBadge) {
      if (deadlocked) {
        this.dom.statusBadge.innerHTML = `<span style="color:var(--color-danger);font-weight:bold;">⚠️ DEADLOCK DETECTED! (Circular Wait: all holding 1 chopstick)</span>`;
        if (this.dom.deadlockBanner) this.dom.deadlockBanner.style.display = 'block';
        this.setNarrative(
          '⚠️',
          'Deadlock State: Circular Wait Formed',
          'Every philosopher has acquired their left chopstick and is blocked waiting for their right chopstick held by their neighbor! Coffman conditions satisfied: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait. Reset to restore normal execution.',
          'blocked'
        );
      } else {
        if (this.dom.deadlockBanner) this.dom.deadlockBanner.style.display = 'none';
        if (eatingPhilosophers.length > 0) {
          this.dom.statusBadge.innerHTML = `<span style="color:var(--color-success);">● EATING IN PROGRESS (${eatingPhilosophers.map(id => 'P' + id).join(' & ')} eating simultaneously)</span>`;
          this.setNarrative(
            '😋',
            `Philosopher ${eatingPhilosophers.map(id => 'P' + id).join(' and ')} are Eating`,
            `Concurrent Eating: Philosophers ${eatingPhilosophers.map(id => 'P' + id).join(' & ')} acquired both their required chopsticks. Maximum 2 non-adjacent philosophers can eat simultaneously in a 5-chair dining setup.`,
            'cs-active'
          );
        } else {
          this.dom.statusBadge.innerHTML = `<span style="color:var(--teal-400);">● RUNNING: All philosophers thinking or waiting</span>`;
        }
      }
    }
  }

  isDeadlocked() {
    return this.chopsticks.every(c => c === 0) && this.philosophers.every(p => p.state === 'hungry');
  }

  makePhilosopherHungry(id) {
    if (this.philosophers[id].state === 'thinking') {
      this.philosophers[id].state = 'hungry';
      this.log(`Philosopher ${id} is now HUNGRY and wants chopsticks C${this.philosophers[id].leftChopstick} & C${this.philosophers[id].rightChopstick}.`, 'warn');
      this.setNarrative(
        '🤤',
        `Philosopher P${id} is Hungry`,
        `Philosopher P${id} wants to eat. Needs both Chopstick C${this.philosophers[id].leftChopstick} (left) and C${this.philosophers[id].rightChopstick} (right). Waiting for chopsticks to become available.`,
        ''
      );
      this.updateUI();
    }
  }

  triggerDeadlockScenario() {
    this.stopAutoPlay();
    // Force every philosopher to grab their left chopstick simultaneously
    for (let i = 0; i < 5; i++) {
      this.philosophers[i].state = 'hungry';
      this.chopsticks[i] = 0; // Take left chopstick
      this.chopstickOwners[i] = i;
    }
    this.log('🚨 DEADLOCK SIMULATION TRIGGERED: Every philosopher holds their left chopstick and waits indefinitely for their right!', 'danger');
    this.highlightLine('left_fork');
    this.updateUI();
  }

  step() {
    // 1. Progress eating philosophers
    let stateChanged = false;
    for (let i = 0; i < 5; i++) {
      const p = this.philosophers[i];
      if (p.state === 'eating') {
        p.eatDuration++;
        if (p.eatDuration >= 2) {
          // Finished eating: release chopsticks
          this.chopsticks[p.leftChopstick] = 1;
          this.chopsticks[p.rightChopstick] = 1;
          this.chopstickOwners[p.leftChopstick] = null;
          this.chopstickOwners[p.rightChopstick] = null;
          p.state = 'thinking';
          p.eatDuration = 0;
          this.highlightLine('drop_left');
          this.log(`Philosopher ${p.id} finished eating. Released chopsticks C${p.leftChopstick} and C${p.rightChopstick}. Now thinking.`, 'success');
          this.setNarrative(
            '🧠',
            `Philosopher P${p.id} Finished Eating`,
            `Philosopher P${p.id} finished eating, released chopsticks C${p.leftChopstick} & C${p.rightChopstick}, and transitioned back to thinking. Neighbors can now acquire these chopsticks.`,
            ''
          );
          stateChanged = true;
        }
      }
    }

    // 2. Check hungry philosophers using asymmetric algorithm (preventing deadlock)
    for (let i = 0; i < 5; i++) {
      const p = this.philosophers[i];
      if (p.state === 'hungry') {
        const left = p.leftChopstick;
        const right = p.rightChopstick;

        // Check availability of both chopsticks
        if (this.chopsticks[left] === 1 && this.chopsticks[right] === 1) {
          this.chopsticks[left] = 0;
          this.chopsticks[right] = 0;
          this.chopstickOwners[left] = p.id;
          this.chopstickOwners[right] = p.id;
          p.state = 'eating';
          p.eatDuration = 0;
          this.highlightLine('eat');
          this.log(`Philosopher ${p.id} acquired chopsticks C${left} and C${right} -> Now EATING! 🍝`, 'highlight');
          stateChanged = true;
          break; // One transition per step
        }
      }
    }

    // 3. Spontaneously make some thinking philosopher hungry if none are hungry
    if (!stateChanged) {
      const thinking = this.philosophers.filter(p => p.state === 'thinking');
      if (thinking.length > 0) {
        const randomP = thinking[Math.floor(Math.random() * thinking.length)];
        this.makePhilosopherHungry(randomP.id);
      }
    }

    this.updateUI();
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
    this.chopsticks = [1, 1, 1, 1, 1];
    this.chopstickOwners = [null, null, null, null, null];
    this.philosophers = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      state: 'thinking',
      leftChopstick: i,
      rightChopstick: (i + 1) % 5,
      eatDuration: 0
    }));
    if (this.dom.deadlockBanner) this.dom.deadlockBanner.style.display = 'none';
    this.updateUI();
    this.highlightLine(null);
    this.setNarrative(
      '🍝',
      'Philosophers State: Active Thinking',
      'All 5 philosophers are currently thinking. Each philosopher requires both their left and right chopsticks to eat. An asymmetric pickup protocol is active to eliminate circular wait and prevent deadlock.',
      ''
    );
    this.log('Dining Philosophers simulation reset.', 'highlight');
  }
}

window.DiningPhilosophersSim = DiningPhilosophersSim;
