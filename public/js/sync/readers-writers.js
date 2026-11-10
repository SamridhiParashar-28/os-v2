// Readers-Writers Problem Simulation (Reader-Preference Protocol)
class ReadersWritersSim {
  constructor() {
    this.readCount = 0;
    this.mutex = 1;
    this.rwMutex = 1;

    this.activeReaders = [];
    this.activeWriter = null;
    this.waitingReaders = [];
    this.waitingWriters = [];

    this.readerIdCounter = 1;
    this.writerIdCounter = 1;

    this.isPlaying = false;
    this.speedMultiplier = 1;
    this.timer = null;

    this.initDOM();
  }

  initDOM() {
    this.dom = {
      semRwMutex: document.getElementById('sem-rw-mutex'),
      semMutex: document.getElementById('sem-rw-internal-mutex'),
      semReadCount: document.getElementById('sem-rw-readcount'),
      activeReadersChipBox: document.getElementById('rw-active-readers'),
      activeWriterChipBox: document.getElementById('rw-active-writer'),
      waitingReadersBox: document.getElementById('rw-waiting-readers'),
      waitingWritersBox: document.getElementById('rw-waiting-writers'),
      databaseBox: document.getElementById('rw-database-zone'),
      statusBadge: document.getElementById('rw-status-badge'),
      logBox: document.getElementById('rw-log-box'),
      codeContainer: document.getElementById('rw-code-container'),
      btnPlayPause: document.getElementById('rw-btn-play'),
      btnStep: document.getElementById('rw-btn-step'),
      btnReset: document.getElementById('rw-btn-reset'),
      btnAddReader: document.getElementById('rw-btn-add-reader'),
      btnAddWriter: document.getElementById('rw-btn-add-writer'),
      speedSlider: document.getElementById('rw-speed')
    };

    this.renderCode();
    this.updateUI();
    this.bindEvents();
    this.log('Readers-Writers simulation initialized. rw_mutex = 1, mutex = 1, read_count = 0.');
  }

  renderCode() {
    if (!this.dom.codeContainer) return;
    const data = window.OS_PSEUDOCODE.readersWriters;
    this.dom.codeContainer.innerHTML = data.code.map(item => `
      <div class="code-line" id="rw-line-${item.line}" data-phase="${item.phase || ''}">
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
    this.dom.btnAddReader?.addEventListener('click', () => this.addReader());
    this.dom.btnAddWriter?.addEventListener('click', () => this.addWriter());
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
    if (this.dom.semRwMutex) this.dom.semRwMutex.textContent = this.rwMutex;
    if (this.dom.semMutex) this.dom.semMutex.textContent = this.mutex;
    if (this.dom.semReadCount) this.dom.semReadCount.textContent = this.readCount;

    // Active readers inside database
    if (this.dom.activeReadersChipBox) {
      this.dom.activeReadersChipBox.innerHTML = this.activeReaders.length > 0 
        ? this.activeReaders.map(id => `<span class="actor-chip reader">📖 Reader #${id}</span>`).join('')
        : '<small style="color:var(--text-muted);">None reading</small>';
    }

    // Active writer
    if (this.dom.activeWriterChipBox) {
      this.dom.activeWriterChipBox.innerHTML = this.activeWriter !== null
        ? `<span class="actor-chip writer">✍️ Writer #${this.activeWriter}</span>`
        : '<small style="color:var(--text-muted);">None writing</small>';
    }

    // Queues
    if (this.dom.waitingReadersBox) {
      this.dom.waitingReadersBox.innerHTML = this.waitingReaders.length > 0
        ? this.waitingReaders.map(id => `<span class="actor-chip reader">Reader #${id}</span>`).join('')
        : '<small style="color:var(--text-muted);">Queue empty</small>';
    }

    if (this.dom.waitingWritersBox) {
      this.dom.waitingWritersBox.innerHTML = this.waitingWriters.length > 0
        ? this.waitingWriters.map(id => `<span class="actor-chip writer">Writer #${id}</span>`).join('')
        : '<small style="color:var(--text-muted);">Queue empty</small>';
    }

    // Database Status
    if (this.dom.databaseBox && this.dom.statusBadge) {
      if (this.activeWriter !== null) {
        this.dom.databaseBox.className = 'shared-database cs-zone occupied';
        this.dom.statusBadge.innerHTML = `<span style="color:var(--color-danger);">● EXCLUSIVE WRITE LOCK (Writer #${this.activeWriter})</span>`;
      } else if (this.activeReaders.length > 0) {
        this.dom.databaseBox.className = 'shared-database cs-zone reading';
        this.dom.statusBadge.innerHTML = `<span style="color:var(--color-info);">● SHARED READ LOCK (${this.activeReaders.length} concurrent readers)</span>`;
      } else {
        this.dom.databaseBox.className = 'shared-database cs-zone free';
        this.dom.statusBadge.innerHTML = `<span style="color:var(--color-success);">● IDLE (Database Unlocked)</span>`;
      }
    }
  }

  addReader() {
    const id = this.readerIdCounter++;
    this.waitingReaders.push(id);
    this.log(`Reader #${id} arrived and queued.`, 'highlight');
    this.updateUI();
  }

  addWriter() {
    const id = this.writerIdCounter++;
    this.waitingWriters.push(id);
    this.log(`Writer #${id} arrived and queued for exclusive lock.`, 'warn');
    this.updateUI();
  }

  step() {
    // 1. If active writer is working, writer finishes and exits
    if (this.activeWriter !== null) {
      const finishedWriter = this.activeWriter;
      this.activeWriter = null;
      this.rwMutex = 1;
      this.highlightLine('writer_signal');
      this.log(`Writer #${finishedWriter} finished writing and released rw_mutex lock.`, 'success');
      this.updateUI();
      return;
    }

    // 2. If readers are active, one can finish reading
    if (this.activeReaders.length > 0 && (Math.random() > 0.4 || this.waitingWriters.length > 0)) {
      const finishedReader = this.activeReaders.shift();
      this.readCount--;
      this.highlightLine('reader_dec');
      this.log(`Reader #${finishedReader} finished reading. read_count = ${this.readCount}.`, 'normal');

      if (this.readCount === 0) {
        this.rwMutex = 1;
        this.highlightLine('reader_release_writer');
        this.log(`Last reader left. Released rw_mutex (Writers may now proceed).`, 'success');
      }
      this.updateUI();
      return;
    }

    // 3. If readers are waiting and no writer is inside: readers enter!
    if (this.waitingReaders.length > 0) {
      const readerId = this.waitingReaders.shift();
      if (this.readCount === 0) {
        if (this.rwMutex === 1) {
          this.rwMutex = 0; // First reader locks out writers
          this.highlightLine('reader_lock_writer');
          this.log(`Reader #${readerId} is 1st reader: Acquired rw_mutex lock (writers blocked).`, 'highlight');
        } else {
          // Locked by writer, reader must wait
          this.waitingReaders.unshift(readerId);
          this.log(`Reader #${readerId} blocked: Writer holds database lock.`, 'warn');
          this.updateUI();
          return;
        }
      }
      this.readCount++;
      this.activeReaders.push(readerId);
      this.highlightLine('reader_reading');
      this.log(`Reader #${readerId} entered database. Total concurrent readers: ${this.readCount}.`, 'highlight');
      this.updateUI();
      return;
    }

    // 4. If no readers inside and writer is waiting: writer enters!
    if (this.waitingWriters.length > 0 && this.readCount === 0 && this.rwMutex === 1) {
      const writerId = this.waitingWriters.shift();
      this.rwMutex = 0;
      this.activeWriter = writerId;
      this.highlightLine('writer_writing');
      this.log(`Writer #${writerId} acquired exclusive rw_mutex and entered database.`, 'danger');
      this.updateUI();
      return;
    }

    // 5. If everything idle, generate a random arrival for lively visualization
    if (this.waitingReaders.length === 0 && this.waitingWriters.length === 0 && this.activeReaders.length === 0 && this.activeWriter === null) {
      if (Math.random() > 0.35) {
        this.addReader();
      } else {
        this.addWriter();
      }
    }
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
    const interval = Math.max(600, 1600 / this.speedMultiplier);
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
    this.readCount = 0;
    this.mutex = 1;
    this.rwMutex = 1;
    this.activeReaders = [];
    this.activeWriter = null;
    this.waitingReaders = [];
    this.waitingWriters = [];
    this.readerIdCounter = 1;
    this.writerIdCounter = 1;
    this.updateUI();
    this.highlightLine(null);
    this.log('Readers-Writers simulation reset.', 'highlight');
  }
}

window.ReadersWritersSim = ReadersWritersSim;

