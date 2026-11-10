// Contiguous Memory Allocation Simulation (First Fit, Best Fit, Worst Fit)
class ContiguousMemorySim {
  constructor() {
    this.totalMemory = 1000; // KB
    // Initial blocks
    this.blocks = [
      { id: 'OS', start: 0, size: 100, type: 'os', label: 'OS Reserved' },
      { id: 'P1', start: 100, size: 200, type: 'process', label: 'Process P1' },
      { id: 'H1', start: 300, size: 150, type: 'hole', label: 'Free Hole' },
      { id: 'P2', start: 450, size: 250, type: 'process', label: 'Process P2' },
      { id: 'H2', start: 700, size: 300, type: 'hole', label: 'Free Hole' }
    ];

    this.currentAlgorithm = 'first'; // 'first', 'best', 'worst'
    this.pidCounter = 3;

    // Metrics tracking
    this.metrics = {
      first: { attempts: 0, successes: 0, holesChecked: 0 },
      best: { attempts: 0, successes: 0, holesChecked: 0 },
      worst: { attempts: 0, successes: 0, holesChecked: 0 }
    };

    this.initDOM();
  }

  initDOM() {
    this.dom = {
      memoryBar: document.getElementById('contig-mem-bar'),
      blockList: document.getElementById('contig-block-table'),
      algoSelect: document.getElementById('contig-algo-select'),
      processSizeInput: document.getElementById('contig-proc-size'),
      btnAllocate: document.getElementById('contig-btn-allocate'),
      btnDeallocRandom: document.getElementById('contig-btn-dealloc'),
      btnCompact: document.getElementById('contig-btn-compact'),
      btnReset: document.getElementById('contig-btn-reset'),
      btnRandomWorkload: document.getElementById('contig-btn-workload'),
      totalFreeDisplay: document.getElementById('contig-total-free'),
      extFragDisplay: document.getElementById('contig-ext-frag'),
      activeAlgoDisplay: document.getElementById('contig-active-algo-name'),
      metricsFirst: document.getElementById('metric-first-fit'),
      metricsBest: document.getElementById('metric-best-fit'),
      metricsWorst: document.getElementById('metric-worst-fit'),
      logBox: document.getElementById('contig-log-box')
    };

    this.render();
    this.bindEvents();
    this.log('Contiguous Memory Visualizer loaded. Default strategy: First Fit.');
  }

  bindEvents() {
    this.dom.algoSelect?.addEventListener('change', (e) => {
      this.currentAlgorithm = e.target.value;
      if (this.dom.activeAlgoDisplay) {
        this.dom.activeAlgoDisplay.textContent = e.target.options[e.target.selectedIndex].text;
      }
      this.log(`Switched allocation algorithm to: ${e.target.options[e.target.selectedIndex].text}.`, 'highlight');
      this.updateMetricsDisplay();
    });

    this.dom.btnAllocate?.addEventListener('click', () => {
      const size = parseInt(this.dom.processSizeInput?.value || '120', 10);
      if (isNaN(size) || size <= 0) {
        alert('Please enter a valid positive memory size in KB');
        return;
      }
      this.allocateProcess(size);
    });

    this.dom.btnDeallocRandom?.addEventListener('click', () => this.deallocateOldest());
    this.dom.btnCompact?.addEventListener('click', () => this.compactMemory());
    this.dom.btnReset?.addEventListener('click', () => this.reset());
    this.dom.btnRandomWorkload?.addEventListener('click', () => this.runRandomWorkload());
  }

  log(text, type = 'normal') {
    if (!this.dom.logBox) return;
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-text ${type}">${text}</span>`;
    this.dom.logBox.prepend(entry);
  }

  render() {
    this.renderMemoryBar();
    this.renderBlockTable();
    this.updateStats();
    this.updateMetricsDisplay();
  }

  renderMemoryBar() {
    if (!this.dom.memoryBar) return;
    this.dom.memoryBar.innerHTML = this.blocks.map(b => {
      const widthPct = (b.size / this.totalMemory) * 100;
      let cssClass = 'mem-block ';
      if (b.type === 'os') cssClass += 'os-reserved';
      else if (b.type === 'process') cssClass += 'allocated';
      else cssClass += 'free-hole';

      return `
        <div class="${cssClass}" style="width: ${widthPct}%;" title="${b.label}: [${b.start} KB - ${b.start + b.size} KB] (${b.size} KB)" onclick="window.contigSim.handleBlockClick('${b.id}')">
          <span class="block-label">${b.id}</span>
          <span class="block-size">${b.size} KB</span>
        </div>
      `;
    }).join('');
  }

  renderBlockTable() {
    if (!this.dom.blockList) return;
    this.dom.blockList.innerHTML = this.blocks.map(b => `
      <tr class="${b.type === 'hole' ? 'row-hole' : ''}">
        <td><strong>${b.id}</strong></td>
        <td><span class="badge ${b.type === 'process' ? 'badge-teal' : b.type === 'os' ? 'badge-purple' : 'badge-warning'}">${b.type.toUpperCase()}</span></td>
        <td>${b.start} KB</td>
        <td>${b.size} KB</td>
        <td>${b.start + b.size - 1} KB</td>
        <td>
          ${b.type === 'process' ? `<button class="btn btn-sm btn-danger" onclick="window.contigSim.deallocateBlock('${b.id}')">Free</button>` : '-'}
        </td>
      </tr>
    `).join('');
  }

  handleBlockClick(blockId) {
    const block = this.blocks.find(b => b.id === blockId);
    if (block && block.type === 'process') {
      if (confirm(`Do you want to free process ${block.id} (${block.size} KB)?`)) {
        this.deallocateBlock(blockId);
      }
    }
  }

  updateStats() {
    const holes = this.blocks.filter(b => b.type === 'hole');
    const totalFree = holes.reduce((sum, h) => sum + h.size, 0);
    const maxSingleHole = holes.length > 0 ? Math.max(...holes.map(h => h.size)) : 0;
    const extFrag = totalFree - maxSingleHole;

    if (this.dom.totalFreeDisplay) this.dom.totalFreeDisplay.textContent = `${totalFree} KB`;
    if (this.dom.extFragDisplay) this.dom.extFragDisplay.textContent = `${extFrag} KB`;
  }

  updateMetricsDisplay() {
    ['first', 'best', 'worst'].forEach(algo => {
      const metric = this.metrics[algo];
      const el = document.getElementById(`metric-${algo}-fit`);
      if (el) {
        const rate = metric.attempts > 0 ? Math.round((metric.successes / metric.attempts) * 100) : 100;
        el.innerHTML = `
          <div class="strategy-metric"><span>Attempts:</span> <strong>${metric.attempts}</strong></div>
          <div class="strategy-metric"><span>Success Rate:</span> <strong>${rate}%</strong></div>
          <div class="strategy-metric"><span>Holes Examined:</span> <strong>${metric.holesChecked}</strong></div>
        `;
      }
      const card = document.getElementById(`card-${algo}-fit`);
      if (card) {
        if (this.currentAlgorithm === algo) card.classList.add('selected');
        else card.classList.remove('selected');
      }
    });
  }

  allocateProcess(size) {
    const pid = `P${this.pidCounter++}`;
    const holes = [];
    this.blocks.forEach((b, idx) => {
      if (b.type === 'hole') holes.push({ ...b, blockIndex: idx });
    });

    this.metrics[this.currentAlgorithm].attempts++;
    let chosenHole = null;
    let checkedCount = 0;

    if (this.currentAlgorithm === 'first') {
      // First Fit: first hole that is large enough
      for (let h of holes) {
        checkedCount++;
        if (h.size >= size) {
          chosenHole = h;
          break;
        }
      }
    } else if (this.currentAlgorithm === 'best') {
      // Best Fit: smallest hole that is large enough
      let minDiff = Infinity;
      for (let h of holes) {
        checkedCount++;
        if (h.size >= size) {
          const diff = h.size - size;
          if (diff < minDiff) {
            minDiff = diff;
            chosenHole = h;
          }
        }
      }
    } else if (this.currentAlgorithm === 'worst') {
      // Worst Fit: largest available hole
      let maxHoleSize = -1;
      for (let h of holes) {
        checkedCount++;
        if (h.size >= size && h.size > maxHoleSize) {
          maxHoleSize = h.size;
          chosenHole = h;
        }
      }
    }

    this.metrics[this.currentAlgorithm].holesChecked += checkedCount;

    if (!chosenHole) {
      this.log(`❌ Allocation FAILED for ${pid} (${size} KB): No contiguous free hole of size >= ${size} KB. (External Fragmentation issue!)`, 'danger');
      this.render();
      return false;
    }

    // Hole found: partition it
    this.metrics[this.currentAlgorithm].successes++;
    const origIndex = chosenHole.blockIndex;
    const oldHole = this.blocks[origIndex];

    const newProcBlock = {
      id: pid,
      start: oldHole.start,
      size: size,
      type: 'process',
      label: `Process ${pid}`
    };

    const remainingSize = oldHole.size - size;
    if (remainingSize > 0) {
      const remainderHole = {
        id: `H_${Math.floor(Math.random() * 900 + 100)}`,
        start: oldHole.start + size,
        size: remainingSize,
        type: 'hole',
        label: 'Free Hole'
      };
      this.blocks.splice(origIndex, 1, newProcBlock, remainderHole);
    } else {
      this.blocks.splice(origIndex, 1, newProcBlock);
    }

    this.log(`✅ Allocated ${pid} (${size} KB) using ${this.currentAlgorithm.toUpperCase()} FIT at address [${newProcBlock.start} - ${newProcBlock.start + size} KB]. Examined ${checkedCount} holes.`, 'success');
    this.render();
    return true;
  }

  deallocateBlock(blockId) {
    const idx = this.blocks.findIndex(b => b.id === blockId);
    if (idx === -1 || this.blocks[idx].type !== 'process') return;

    const freed = this.blocks[idx];
    freed.type = 'hole';
    freed.label = 'Free Hole';
    freed.id = `H_${freed.start}`;

    this.log(`Freed process ${blockId} (${freed.size} KB at address ${freed.start} KB). Coalescing adjacent holes...`, 'highlight');
    this.coalesceHoles();
    this.render();
  }

  deallocateOldest() {
    const proc = this.blocks.find(b => b.type === 'process');
    if (!proc) {
      this.log('No processes currently allocated to free.', 'warn');
      return;
    }
    this.deallocateBlock(proc.id);
  }

  coalesceHoles() {
    const merged = [];
    for (let i = 0; i < this.blocks.length; i++) {
      const current = this.blocks[i];
      if (merged.length > 0) {
        const last = merged[merged.length - 1];
        if (last.type === 'hole' && current.type === 'hole') {
          // Merge holes
          last.size += current.size;
          continue;
        }
      }
      merged.push({ ...current });
    }
    this.blocks = merged;
  }

  compactMemory() {
    // Memory Compaction: Shift all allocated blocks toward the OS partition, coalescing all holes at the high-memory end
    const osBlock = this.blocks.find(b => b.type === 'os');
    const procBlocks = this.blocks.filter(b => b.type === 'process');
    const totalProcMemory = procBlocks.reduce((sum, p) => sum + p.size, 0);

    let currentStart = osBlock ? osBlock.size : 0;
    const newBlocks = osBlock ? [{ ...osBlock }] : [];

    procBlocks.forEach(p => {
      newBlocks.push({
        ...p,
        start: currentStart
      });
      currentStart += p.size;
    });

    const freeRemaining = this.totalMemory - currentStart;
    if (freeRemaining > 0) {
      newBlocks.push({
        id: 'H_COMPACT',
        start: currentStart,
        size: freeRemaining,
        type: 'hole',
        label: 'Compacted Free Space'
      });
    }

    this.blocks = newBlocks;
    this.log(`⚡ Memory Compaction complete! All processes relocated. Single contiguous free hole created (${freeRemaining} KB). External fragmentation eliminated!`, 'success');
    this.render();
  }

  runRandomWorkload() {
    this.log('Running automated random workload (Allocations & Deallocations)...', 'highlight');
    const sizes = [80, 120, 150, 200, 240, 90];
    const chosenSize = sizes[Math.floor(Math.random() * sizes.length)];

    if (Math.random() > 0.4 || this.blocks.filter(b => b.type === 'process').length < 2) {
      this.allocateProcess(chosenSize);
    } else {
      this.deallocateOldest();
    }
  }

  reset() {
    this.blocks = [
      { id: 'OS', start: 0, size: 100, type: 'os', label: 'OS Reserved' },
      { id: 'P1', start: 100, size: 200, type: 'process', label: 'Process P1' },
      { id: 'H1', start: 300, size: 150, type: 'hole', label: 'Free Hole' },
      { id: 'P2', start: 450, size: 250, type: 'process', label: 'Process P2' },
      { id: 'H2', start: 700, size: 300, type: 'hole', label: 'Free Hole' }
    ];
    this.pidCounter = 3;
    this.render();
    this.log('Contiguous memory reset to initial state.', 'highlight');
  }
}

window.ContiguousMemorySim = ContiguousMemorySim;

