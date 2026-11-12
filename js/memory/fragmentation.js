// Internal vs External Fragmentation Visualizer
class FragmentationSim {
  constructor() {
    this.initDOM();
  }

  initDOM() {
    this.dom = {
      internalAllocInput: document.getElementById('frag-internal-size'),
      btnCalcInternal: document.getElementById('frag-btn-calc-internal'),
      internalWasteDisplay: document.getElementById('frag-internal-waste'),
      internalPartitionBox: document.getElementById('frag-internal-box'),

      extHolesContainer: document.getElementById('frag-ext-holes'),
      extReqInput: document.getElementById('frag-ext-req-size'),
      btnTestExternal: document.getElementById('frag-btn-test-ext'),
      extResultDisplay: document.getElementById('frag-ext-result'),
      btnRunCompact: document.getElementById('frag-btn-compact-demo')
    };

    this.bindEvents();
    this.calcInternal(74);
    this.testExternal(90);
  }

  bindEvents() {
    this.dom.btnCalcInternal?.addEventListener('click', () => {
      const size = parseInt(this.dom.internalAllocInput?.value || '70', 10);
      this.calcInternal(size);
    });

    this.dom.btnTestExternal?.addEventListener('click', () => {
      const size = parseInt(this.dom.extReqInput?.value || '90', 10);
      this.testExternal(size);
    });

    this.dom.btnRunCompact?.addEventListener('click', () => this.runCompactionVisual());
  }

  calcInternal(neededSize) {
    const fixedSlotSize = 100; // KB
    if (neededSize > fixedSlotSize) {
      alert(`Process size cannot exceed partition size (${fixedSlotSize} KB).`);
      return;
    }

    const waste = fixedSlotSize - neededSize;
    if (this.dom.internalWasteDisplay) {
      this.dom.internalWasteDisplay.textContent = `${waste} KB wasted (${waste}%)`;
    }

    if (this.dom.internalPartitionBox) {
      const usedPct = (neededSize / fixedSlotSize) * 100;
      const wastePct = 100 - usedPct;
      this.dom.internalPartitionBox.innerHTML = `
        <div style="display:flex; height:60px; width:100%; border:2px solid var(--border-color); border-radius:var(--radius-md); overflow:hidden;">
          <div style="width:${usedPct}%; background:linear-gradient(135deg, var(--teal-500), #0d9488); display:flex; align-items:center; justify-content:center; color:#fff; font-size:12px; font-weight:700;">
            Used (${neededSize} KB)
          </div>
          <div class="internal-frag-stripe" style="width:${wastePct}%;">
            Internal Frag: ${waste} KB
          </div>
        </div>
      `;
    }
  }

  testExternal(requestedSize) {
    const holes = [35, 45, 30]; // Total 110 KB free
    const totalFree = holes.reduce((a, b) => a + b, 0);
    const maxHole = Math.max(...holes);

    if (this.dom.extResultDisplay) {
      if (requestedSize > totalFree) {
        this.dom.extResultDisplay.innerHTML = `<span style="color:var(--color-danger)">Cannot allocate: Process size (${requestedSize} KB) exceeds total free memory (${totalFree} KB).</span>`;
      } else if (requestedSize > maxHole) {
        this.dom.extResultDisplay.innerHTML = `
          <span style="color:var(--color-danger); font-weight:bold;">
            ❌ EXTERNAL FRAGMENTATION OCCURRED!
          </span><br>
          <small>Total free memory is <strong>${totalFree} KB</strong> (enough for ${requestedSize} KB), but it is scattered into holes of [35 KB, 45 KB, 30 KB]. No single hole can fit ${requestedSize} KB!</small>
        `;
      } else {
        this.dom.extResultDisplay.innerHTML = `
          <span style="color:var(--color-success); font-weight:bold;">
            ✅ Allocatable!
          </span><br>
          <small>A hole of size ${maxHole} KB can fit the requested ${requestedSize} KB.</small>
        `;
      }
    }
  }

  runCompactionVisual() {
    if (!this.dom.extHolesContainer) return;
    this.dom.extHolesContainer.innerHTML = `
      <div style="height:60px; width:100%; display:flex; border:2px solid var(--teal-500); border-radius:var(--radius-md); overflow:hidden; animation: fadeIn 0.4s ease;">
        <div style="flex:1; background:linear-gradient(135deg, var(--teal-500), var(--teal-400)); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:bold;">
          Compacted Free Hole: 110 KB Contiguous Memory!
        </div>
      </div>
      <small style="color:var(--color-success); font-weight:600; display:block; margin-top:0.4rem;">
        ⚡ All 3 holes coalesced into a single 110 KB partition. Request for 90 KB can now be satisfied!
      </small>
    `;
    if (this.dom.extResultDisplay) {
      this.dom.extResultDisplay.innerHTML = `<span style="color:var(--color-success); font-weight:bold;">✅ Allocation Succeeded after Compaction!</span>`;
    }
  }
}

window.FragmentationSim = FragmentationSim;

