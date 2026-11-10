// Paging & Address Translation Simulation
class PagingSim {
  constructor() {
    this.pageSize = 1024; // 1 KB per page
    this.numPages = 8;    // 8 Logical Pages (P0 to P7) -> 8 KB logical address space
    this.numFrames = 8;   // 8 Physical Frames (F0 to F7) -> 8 KB physical memory

    // Page Table mapping: page -> { frame, valid, protection }
    this.pageTable = [
      { page: 0, frame: 3, valid: true, desc: 'Code (.text)' },
      { page: 1, frame: 5, valid: true, desc: 'Code (.text)' },
      { page: 2, frame: 1, valid: true, desc: 'Data (.data)' },
      { page: 3, frame: 7, valid: true, desc: 'Heap' },
      { page: 4, frame: -1, valid: false, desc: 'Unmapped (On Disk)' },
      { page: 5, frame: -1, valid: false, desc: 'Unmapped (On Disk)' },
      { page: 6, frame: 2, valid: true, desc: 'Stack' },
      { page: 7, frame: 6, valid: true, desc: 'Stack' }
    ];

    this.initDOM();
  }

  initDOM() {
    this.dom = {
      logicalPagesList: document.getElementById('paging-logical-list'),
      pageTableBody: document.getElementById('paging-table-body'),
      physicalFramesList: document.getElementById('paging-frames-list'),
      inputLogicalAddr: document.getElementById('paging-input-addr'),
      btnTranslate: document.getElementById('paging-btn-translate'),
      btnPreset1: document.getElementById('paging-preset-1'),
      btnPreset2: document.getElementById('paging-preset-2'),
      btnPreset3: document.getElementById('paging-preset-fault'),
      calcPageNum: document.getElementById('paging-calc-p'),
      calcOffset: document.getElementById('paging-calc-d'),
      calcFrameNum: document.getElementById('paging-calc-f'),
      calcPhysAddr: document.getElementById('paging-calc-phys'),
      stepLog: document.getElementById('paging-step-explanation'),
      logBox: document.getElementById('paging-log-box')
    };

    this.render();
    this.bindEvents();
    this.log('Paging & Address Translation engine ready. Page Size = 1024 Bytes (1 KB).');
  }

  bindEvents() {
    this.dom.btnTranslate?.addEventListener('click', () => {
      const addr = parseInt(this.dom.inputLogicalAddr?.value || '2500', 10);
      this.translateAddress(addr);
    });

    this.dom.btnPreset1?.addEventListener('click', () => {
      if (this.dom.inputLogicalAddr) this.dom.inputLogicalAddr.value = '1500';
      this.translateAddress(1500);
    });

    this.dom.btnPreset2?.addEventListener('click', () => {
      if (this.dom.inputLogicalAddr) this.dom.inputLogicalAddr.value = '6500';
      this.translateAddress(6500);
    });

    this.dom.btnPreset3?.addEventListener('click', () => {
      if (this.dom.inputLogicalAddr) this.dom.inputLogicalAddr.value = '4200'; // Maps to page 4 (invalid)
      this.translateAddress(4200);
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

  render() {
    this.renderLogicalPages();
    this.renderPageTable();
    this.renderPhysicalFrames();
  }

  renderLogicalPages(activePage = null) {
    if (!this.dom.logicalPagesList) return;
    this.dom.logicalPagesList.innerHTML = this.pageTable.map(pt => {
      const isSelected = activePage === pt.page;
      return `
        <div class="page-item ${isSelected ? 'active-highlight' : ''}">
          <span><strong>Page ${pt.page}</strong> (${pt.desc})</span>
          <span style="font-size:10px; color:var(--text-muted)">${pt.page * this.pageSize} - ${(pt.page + 1) * this.pageSize - 1}</span>
        </div>
      `;
    }).join('');
  }

  renderPageTable(highlightPage = null) {
    if (!this.dom.pageTableBody) return;
    this.dom.pageTableBody.innerHTML = this.pageTable.map(pt => {
      const isHighlighted = highlightPage === pt.page;
      return `
        <tr class="${isHighlighted ? 'active-row' : ''}">
          <td><strong>${pt.page}</strong></td>
          <td>${pt.valid ? `Frame ${pt.frame}` : '<span style="color:var(--color-danger)">NULL</span>'}</td>
          <td><span class="badge ${pt.valid ? 'badge-success' : 'badge-danger'}">${pt.valid ? 'VALID (1)' : 'INVALID (0)'}</span></td>
        </tr>
      `;
    }).join('');
  }

  renderPhysicalFrames(activeFrame = null) {
    if (!this.dom.physicalFramesList) return;
    let framesHtml = '';
    for (let f = 0; f < this.numFrames; f++) {
      const mappedEntry = this.pageTable.find(pt => pt.valid && pt.frame === f);
      const isSelected = activeFrame === f;
      framesHtml += `
        <div class="frame-item ${isSelected ? 'active-highlight' : ''}">
          <span><strong>Frame ${f}</strong> ${mappedEntry ? `[Page ${mappedEntry.page}]` : '<em style="color:var(--text-muted)">Free</em>'}</span>
          <span style="font-size:10px; color:var(--text-muted)">${f * this.pageSize} - ${(f + 1) * this.pageSize - 1}</span>
        </div>
      `;
    }
    this.dom.physicalFramesList.innerHTML = framesHtml;
  }

  translateAddress(logicalAddr) {
    if (isNaN(logicalAddr) || logicalAddr < 0 || logicalAddr >= (this.numPages * this.pageSize)) {
      alert(`Please enter a valid logical address between 0 and ${(this.numPages * this.pageSize) - 1}.`);
      return;
    }

    // Step 1: Calculate Page number p and Offset d
    const p = Math.floor(logicalAddr / this.pageSize);
    const d = logicalAddr % this.pageSize;

    const pageEntry = this.pageTable[p];

    if (this.dom.calcPageNum) this.dom.calcPageNum.textContent = p;
    if (this.dom.calcOffset) this.dom.calcOffset.textContent = d;

    this.renderLogicalPages(p);
    this.renderPageTable(p);

    if (!pageEntry.valid) {
      // PAGE FAULT
      if (this.dom.calcFrameNum) this.dom.calcFrameNum.textContent = 'FAULT';
      if (this.dom.calcPhysAddr) this.dom.calcPhysAddr.textContent = 'PAGE FAULT (Trap)';
      this.renderPhysicalFrames(null);

      if (this.dom.stepLog) {
        this.dom.stepLog.innerHTML = `
          <div style="color:var(--color-danger); font-weight:700;">
            ⚠️ PAGE FAULT! Page ${p} has Valid bit = 0 (Not currently loaded in physical RAM).
          </div>
          <p style="margin-top:0.4rem; font-size:0.8rem;">
            1. CPU generates trap to OS kernel.<br>
            2. OS checks backing store (swap disk) for Page ${p}.<br>
            3. OS brings Page ${p} into an empty physical frame, updates Page Table valid bit to 1, and restarts instruction.
          </p>
        `;
      }
      this.log(`PAGE FAULT at Logical Address ${logicalAddr}: Page ${p} is INVALID. Trap generated.`, 'danger');
      return;
    }

    // Page HIT: Calculate physical address
    const f = pageEntry.frame;
    const physicalAddress = (f * this.pageSize) + d;

    if (this.dom.calcFrameNum) this.dom.calcFrameNum.textContent = f;
    if (this.dom.calcPhysAddr) this.dom.calcPhysAddr.textContent = `${physicalAddress} (0x${physicalAddress.toString(16).toUpperCase()})`;

    this.renderPhysicalFrames(f);

    if (this.dom.stepLog) {
      this.dom.stepLog.innerHTML = `
        <div style="color:var(--color-success); font-weight:700;">
          ✅ TRANSLATION SUCCESS (Hit):
        </div>
        <p style="margin-top:0.4rem; font-size:0.8rem;">
          • Logical Address: <strong>${logicalAddr}</strong><br>
          • Page Number: <code>p = floor(${logicalAddr} / ${this.pageSize}) = ${p}</code><br>
          • Offset: <code>d = ${logicalAddr} % ${this.pageSize} = ${d}</code><br>
          • Page Table Lookup: <code>PageTable[${p}] -> Frame ${f} (Valid)</code><br>
          • Physical Address: <code>(Frame ${f} * ${this.pageSize}) + ${d} = ${physicalAddress}</code>
        </p>
      `;
    }

    this.log(`Translated Logical Address ${logicalAddr} -> Physical Address ${physicalAddress} (Page ${p} -> Frame ${f}, Offset ${d}).`, 'success');
  }
}

window.PagingSim = PagingSim;

