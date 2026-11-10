// Segmentation & Memory Protection Simulation
class SegmentationSim {
  constructor() {
    // Segment Table
    this.segments = [
      { id: 0, name: 'Code Segment (Text)', base: 1400, limit: 1000, protection: 'Read / Execute' },
      { id: 1, name: 'Data Segment (Globals)', base: 6300, limit: 400, protection: 'Read / Write' },
      { id: 2, name: 'Stack Segment', base: 4300, limit: 400, protection: 'Read / Write' },
      { id: 3, name: 'Heap Segment', base: 2500, limit: 1100, protection: 'Read / Write' }
    ];

    this.initDOM();
  }

  initDOM() {
    this.dom = {
      tableBody: document.getElementById('seg-table-body'),
      selectSegment: document.getElementById('seg-select-segment'),
      inputOffset: document.getElementById('seg-input-offset'),
      btnValidate: document.getElementById('seg-btn-validate'),
      btnPresetValid: document.getElementById('seg-preset-valid'),
      btnPresetViolation: document.getElementById('seg-preset-violation'),
      faultBanner: document.getElementById('seg-fault-banner'),
      successBanner: document.getElementById('seg-success-banner'),
      mathLog: document.getElementById('seg-math-log'),
      logBox: document.getElementById('seg-log-box')
    };

    this.renderTable();
    this.bindEvents();
    this.log('Segmentation Engine ready. Segment Table initialized with 4 segments.');
  }

  renderTable(highlightSeg = null) {
    if (!this.dom.tableBody) return;
    this.dom.tableBody.innerHTML = this.segments.map(seg => {
      const isHigh = highlightSeg === seg.id;
      return `
        <tr class="${isHigh ? 'active-row' : ''}">
          <td><strong>Segment ${seg.id}</strong></td>
          <td>${seg.name}</td>
          <td><code>${seg.base}</code></td>
          <td><code>${seg.limit}</code></td>
          <td><span class="badge badge-teal">${seg.protection}</span></td>
        </tr>
      `;
    }).join('');
  }

  bindEvents() {
    this.dom.btnValidate?.addEventListener('click', () => {
      const segId = parseInt(this.dom.selectSegment?.value || '0', 10);
      const offset = parseInt(this.dom.inputOffset?.value || '250', 10);
      this.validateAddress(segId, offset);
    });

    this.dom.btnPresetValid?.addEventListener('click', () => {
      if (this.dom.selectSegment) this.dom.selectSegment.value = '0';
      if (this.dom.inputOffset) this.dom.inputOffset.value = '350';
      this.validateAddress(0, 350);
    });

    this.dom.btnPresetViolation?.addEventListener('click', () => {
      if (this.dom.selectSegment) this.dom.selectSegment.value = '1'; // Data limit is 400
      if (this.dom.inputOffset) this.dom.inputOffset.value = '550'; // 550 >= 400!
      this.validateAddress(1, 550);
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

  validateAddress(segmentId, offset) {
    const seg = this.segments.find(s => s.id === segmentId);
    if (!seg) return;

    this.renderTable(segmentId);

    // Limit Check
    if (offset >= seg.limit) {
      // SEGMENTATION FAULT
      if (this.dom.faultBanner) {
        this.dom.faultBanner.innerHTML = `
          💥 TRAP: SEGMENTATION FAULT (ACCESS VIOLATION)!<br>
          <small>Offset <strong>${offset}</strong> exceeds limit <strong>${seg.limit}</strong> for ${seg.name}. Instruction aborted by CPU MMU.</small>
        `;
        this.dom.faultBanner.classList.add('show');
      }
      if (this.dom.successBanner) this.dom.successBanner.style.display = 'none';

      if (this.dom.mathLog) {
        this.dom.mathLog.innerHTML = `
          <div style="color:var(--color-danger); font-weight:700;">Hardware Limit Check: FAILED</div>
          <p style="font-size:0.8rem; margin-top:0.4rem;">
            <code>offset (${offset}) &lt; limit (${seg.limit}) == FALSE</code><br>
            The program attempted to access unallocated memory outside its declared segment boundary.
          </p>
        `;
      }
      this.log(`SEGMENTATION FAULT: Segment ${segmentId} (${seg.name}) offset ${offset} >= limit ${seg.limit}.`, 'danger');
    } else {
      // VALID ADDRESS
      const physicalAddress = seg.base + offset;
      if (this.dom.faultBanner) this.dom.faultBanner.classList.remove('show');
      if (this.dom.successBanner) {
        this.dom.successBanner.style.display = 'block';
        this.dom.successBanner.innerHTML = `
          ✅ VALID ADDRESS TRANSLATION: Physical Address = <strong>${physicalAddress}</strong>
        `;
      }

      if (this.dom.mathLog) {
        this.dom.mathLog.innerHTML = `
          <div style="color:var(--color-success); font-weight:700;">Hardware Limit Check: PASSED</div>
          <p style="font-size:0.8rem; margin-top:0.4rem;">
            1. Check: <code>offset (${offset}) &lt; limit (${seg.limit}) == TRUE</code><br>
            2. Compute: <code>Physical Address = Base (${seg.base}) + Offset (${offset}) = ${physicalAddress}</code>
          </p>
        `;
      }
      this.log(`Segment ${segmentId} offset ${offset} valid -> Physical Address ${physicalAddress}.`, 'success');
    }
  }
}

window.SegmentationSim = SegmentationSim;

