// Page Replacement Simulation (FIFO and LRU Algorithms)
class PageReplacementSim {
  constructor() {
    this.numFrames = 3;
    this.referenceString = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1];
    this.currentIndex = 0;
    this.algorithm = 'fifo'; // 'fifo' or 'lru'

    this.frames = new Array(this.numFrames).fill(null);
    this.history = []; // record of each step: { page, frames: [...], isHit }
    this.pageFaults = 0;
    this.pageHits = 0;

    // For LRU tracking: records last time each frame was used
    this.lastUsed = new Array(this.numFrames).fill(-1);
    // For FIFO tracking: queue of insertion order
    this.fifoQueue = [];

    this.initDOM();
  }

  initDOM() {
    this.dom = {
      refInput: document.getElementById('pr-input-ref'),
      framesSelect: document.getElementById('pr-select-frames'),
      algoSelect: document.getElementById('pr-select-algo'),
      btnStep: document.getElementById('pr-btn-step'),
      btnRunAll: document.getElementById('pr-btn-run-all'),
      btnReset: document.getElementById('pr-btn-reset'),
      refDisplay: document.getElementById('pr-ref-display'),
      currentFramesBox: document.getElementById('pr-current-frames'),
      faultCountDisplay: document.getElementById('pr-fault-count'),
      hitCountDisplay: document.getElementById('pr-hit-count'),
      hitRatioDisplay: document.getElementById('pr-hit-ratio'),
      historyTableBody: document.getElementById('pr-history-body'),
      logBox: document.getElementById('pr-log-box')
    };

    this.bindEvents();
    this.reset();
  }

  bindEvents() {
    this.dom.btnStep?.addEventListener('click', () => this.step());
    this.dom.btnRunAll?.addEventListener('click', () => this.runAll());
    this.dom.btnReset?.addEventListener('click', () => this.reset());

    this.dom.algoSelect?.addEventListener('change', (e) => {
      this.algorithm = e.target.value;
      this.reset();
    });

    this.dom.framesSelect?.addEventListener('change', (e) => {
      this.numFrames = parseInt(e.target.value, 10);
      this.reset();
    });

    this.dom.refInput?.addEventListener('change', (e) => {
      const parsed = e.target.value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
      if (parsed.length > 0) {
        this.referenceString = parsed;
        this.reset();
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

  reset() {
    this.currentIndex = 0;
    this.frames = new Array(this.numFrames).fill(null);
    this.history = [];
    this.pageFaults = 0;
    this.pageHits = 0;
    this.lastUsed = new Array(this.numFrames).fill(-1);
    this.fifoQueue = [];

    this.renderReferenceString();
    this.renderCurrentFrames();
    this.renderHistory();
    this.updateStats();
    this.log(`Page Replacement simulation reset. Algorithm: ${this.algorithm.toUpperCase()}, Frames: ${this.numFrames}.`, 'highlight');
  }

  renderReferenceString() {
    if (!this.dom.refDisplay) return;
    this.dom.refDisplay.innerHTML = this.referenceString.map((page, idx) => {
      const isPast = idx < this.currentIndex;
      const isCurrent = idx === this.currentIndex;
      let badgeStyle = 'background:var(--bg-card); border:1px solid var(--border-color); color:var(--text-secondary);';
      if (isCurrent) {
        badgeStyle = 'background:var(--teal-500); color:#ffffff; font-weight:800; transform:scale(1.15); box-shadow:0 0 10px var(--teal-glow);';
      } else if (isPast) {
        const histItem = this.history[idx];
        if (histItem) {
          badgeStyle = histItem.isHit
            ? 'background:var(--color-success-bg); border:1px solid var(--color-success); color:var(--color-success);'
            : 'background:var(--color-danger-bg); border:1px solid var(--color-danger); color:var(--color-danger);';
        }
      }
      return `
        <span style="display:inline-flex; width:32px; height:32px; align-items:center; justify-content:center; border-radius:var(--radius-sm); font-family:var(--font-mono); font-size:0.85rem; transition:all var(--transition-fast); ${badgeStyle}">
          ${page}
        </span>
      `;
    }).join(' ');
  }

  renderCurrentFrames() {
    if (!this.dom.currentFramesBox) return;
    this.dom.currentFramesBox.innerHTML = this.frames.map((val, idx) => `
      <div style="flex:1; height:60px; background:var(--bg-card); border:2px solid var(--border-color); border-radius:var(--radius-md); display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:var(--font-mono);">
        <small style="font-size:10px; color:var(--text-muted)">Frame ${idx}</small>
        <strong style="font-size:1.15rem; color:${val !== null ? 'var(--teal-400)' : 'var(--text-muted)'}">${val !== null ? val : '-'}</strong>
      </div>
    `).join('');
  }

  renderHistory() {
    if (!this.dom.historyTableBody) return;
    this.dom.historyTableBody.innerHTML = this.history.map((h, stepIdx) => `
      <tr>
        <td><strong>#${stepIdx + 1}</strong></td>
        <td><code>${h.page}</code></td>
        ${h.frames.map(f => `<td><code>${f !== null ? f : '-'}</code></td>`).join('')}
        <td>
          <span class="badge ${h.isHit ? 'badge-success' : 'badge-danger'}">
            ${h.isHit ? 'PAGE HIT' : 'PAGE FAULT'}
          </span>
        </td>
      </tr>
    `).join('');
  }

  updateStats() {
    const total = this.pageHits + this.pageFaults;
    const ratio = total > 0 ? Math.round((this.pageHits / total) * 100) : 0;
    if (this.dom.faultCountDisplay) this.dom.faultCountDisplay.textContent = this.pageFaults;
    if (this.dom.hitCountDisplay) this.dom.hitCountDisplay.textContent = this.pageHits;
    if (this.dom.hitRatioDisplay) this.dom.hitRatioDisplay.textContent = `${ratio}%`;
  }

  step() {
    if (this.currentIndex >= this.referenceString.length) {
      this.log('End of reference string reached. Simulation complete!', 'success');
      return;
    }

    const page = this.referenceString[this.currentIndex];
    const frameIndex = this.frames.indexOf(page);
    let isHit = false;

    if (frameIndex !== -1) {
      // PAGE HIT!
      isHit = true;
      this.pageHits++;
      this.lastUsed[frameIndex] = this.currentIndex; // Update for LRU
      this.log(`Page ${page} -> PAGE HIT (already resident in Frame ${frameIndex})!`, 'success');
    } else {
      // PAGE FAULT!
      isHit = false;
      this.pageFaults++;

      // Check if there is an empty frame
      const emptyIndex = this.frames.indexOf(null);
      if (emptyIndex !== -1) {
        this.frames[emptyIndex] = page;
        this.lastUsed[emptyIndex] = this.currentIndex;
        this.fifoQueue.push(emptyIndex);
        this.log(`Page ${page} -> PAGE FAULT! Loaded into empty Frame ${emptyIndex}.`, 'warn');
      } else {
        // Replacement needed!
        let victimIndex = 0;
        if (this.algorithm === 'fifo') {
          // FIFO: Evict the frame loaded earliest
          victimIndex = this.fifoQueue.shift();
          this.fifoQueue.push(victimIndex);
        } else if (this.algorithm === 'lru') {
          // LRU: Evict the frame with the oldest (smallest) lastUsed timestamp
          let minTime = Infinity;
          for (let i = 0; i < this.numFrames; i++) {
            if (this.lastUsed[i] < minTime) {
              minTime = this.lastUsed[i];
              victimIndex = i;
            }
          }
        }

        const victimPage = this.frames[victimIndex];
        this.frames[victimIndex] = page;
        this.lastUsed[victimIndex] = this.currentIndex;
        this.log(`Page ${page} -> PAGE FAULT! Evicted Page ${victimPage} from Frame ${victimIndex} using ${this.algorithm.toUpperCase()}.`, 'danger');
      }
    }

    this.history.push({
      page: page,
      frames: [...this.frames],
      isHit: isHit
    });

    this.currentIndex++;
    this.renderReferenceString();
    this.renderCurrentFrames();
    this.renderHistory();
    this.updateStats();
  }

  runAll() {
    while (this.currentIndex < this.referenceString.length) {
      this.step();
    }
  }
}

window.PageReplacementSim = PageReplacementSim;

