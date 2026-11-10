# Process Synchronization & Memory Management Visualizer

An interactive, visual, and animated educational web platform built for Operating Systems (OS) students, instructors, and engineers. This tool illustrates concurrency synchronization primitives, deadlock dynamics, memory allocation heuristics, paging hardware MMU address translation, segmentation limits, and fragmentation analysis.

---

## 🌟 Key Features

### 1. Process Synchronization Dashboard
- **Producer-Consumer Problem (Bounded Buffer)**:
  - Real-time animated circular buffer slots with `IN` and `OUT` pointers.
  - Live semaphore monitors: `mutex` (binary), `empty` (counting), and `full` (counting).
  - Critical Section boundary status indicator (Unlocked vs Locked).
  - Step-by-step trace mode + Auto-play mode + Variable speed slider (0.5x to 3x).
  - Live synchronized C pseudocode line highlighter and chronological event logs.
- **Readers-Writers Problem (Reader Preference Protocol)**:
  - Active readers chip container allowing concurrent database reads.
  - Exclusive writer lock preventing concurrent readers or writers.
  - Interactive queues for waiting readers and writers.
  - Live monitoring of `rw_mutex`, `mutex`, and `read_count`.
- **Dining Philosophers Problem**:
  - 5 Philosophers (P0–P4) and 5 Chopsticks (C0–C4) arranged around a circular table.
  - Visual states: Thinking (🧠), Hungry (🤤), and Eating (😋).
  - Asymmetric pickup algorithm preventing circular wait deadlock.
  - Interactive **Simulate Deadlock** button to force circular wait where all philosophers pick up their left fork simultaneously!
  - Click on any philosopher to manually toggle their state to Hungry.
- **Sleeping Barber Problem**:
  - Cutting room with Barber Chair and 4 Waiting Room chairs.
  - State machine: Barber sleeps (😴💤) when no customers are present.
  - Arriving customers wake the sleeping barber or queue in waiting chairs.
  - Capacity limit balking: if all 4 chairs are occupied, arriving customers leave.

### 2. Memory Management Dashboard
- **Contiguous Allocation (First Fit, Best Fit, Worst Fit)**:
  - Proportional visual RAM bar (0 KB to 1000 KB) with OS-reserved space and dynamic partitions.
  - Live side-by-side strategy metrics: allocation attempts, success rates, and holes examined.
  - Dynamic partition table with base address, block size, and limits.
  - **Memory Compaction Engine**: shifts all allocated blocks toward low memory to coalesce scattered holes into one single contiguous partition, eliminating external fragmentation!
  - Custom process allocation by size (KB), manual process deallocation, and automated random workload tester.
- **Paging & Hardware Address Translation**:
  - Virtual/Logical Page breakdown ($P_0$ to $P_7$) vs Physical Frame RAM breakdown ($F_0$ to $F_7$).
  - Page Table mapping with Frame numbers and Valid/Invalid protection bits.
  - Interactive MMU Calculator: computes Page Number $p = \lfloor \text{addr} / \text{pageSize} \rfloor$, Offset $d = \text{addr} \pmod{\text{pageSize}}$, and Physical Address $= (f \times \text{pageSize}) + d$.
  - **Page Fault Simulation**: trigger access to unmapped page 4 to observe OS kernel trap handling.
- **Segmentation & Protection**:
  - Segment Table containing Code (Text), Data, Stack, and Heap segments with Base and Limit registers.
  - Hardware MMU Limit Comparator: evaluates whether $\text{offset} < \text{Limit}$.
  - **Segmentation Fault (Access Violation)** visual alert when accessing addresses exceeding segment bounds.
- **Internal & External Fragmentation Visualizer**:
  - Interactive comparison between fixed partition internal waste and variable partition external fragmentation.
  - Real-time compaction demo coalescing multiple small holes into a contiguous block.
- **Page Replacement (FIFO & LRU)**:
  - Reference string stream simulator (`7, 0, 1, 2, 0, 3, 0, 4, ...`) with 3 or 4 frame slots.
  - Step-by-step frame matrix allocation, Page Hit vs Page Fault tracking, and live hit ratio percentage.

### 3. Home / Overview Dashboard
- Clean, uncluttered project introduction with quick jump buttons to both modules.
- Direct module navigation cards linking directly into each simulation arena.

### 4. Technical Design & Theme
- Modern Dark Mode default (Deep Navy `#0a0f1d` with Teal `#14b8a6` accents).
- High-contrast Light Mode (Soft Gray `#f8fafc` with Teal accents).
- Persistent theme preference via `localStorage` and system media query detection.

---

## 🚀 One-Click Start (Windows)

For the easiest experience on Windows:
1. Double-click the included **`start.bat`** file.
2. The script will automatically:
   - Check if Node.js is installed.
   - Install dependencies (`npm install`) if `node_modules` is missing.
   - Copy `.env.example` to `.env` if needed.
   - Start the backend server on `http://localhost:3000`.
   - Launch your default web browser directly to the dashboard.

---

## 🛠 Manual Installation & Running

If you prefer using the command line:

```bash
# 1. Clone the repository
git clone <your-repository-url>
cd "os V2"

# 2. Install dependencies
npm install

# 3. (Optional) Configure environment variables
# Copy .env.example to .env
cp .env.example .env

# 4. Start the server
npm start

# 5. Open your browser
# Navigate to: http://localhost:3000
```

---

## 🔒 Privacy & GitHub Deployment Ready

This repository is configured with clean separation between public code and private student data:

- **Private Task Tracker (`task-tracker.json`)**:
  - Records user task completions and learning notes.
  - Automatically created on the server and synced through `/api/progress`.
  - **Explicitly ignored in `.gitignore`** so your personal learning progress is never pushed to public repositories.
- **Environment Secrets (`.env`)**:
  - Contains port configurations and app variables.
  - **Ignored in `.gitignore`**.
  - A clean `.env.example` is provided for public reference.

### Deploying to GitHub
When pushing to GitHub, your sensitive files will stay safe automatically:
```bash
git init
git add .
git commit -m "Initial commit: Process Synchronization & Memory Management Visualizer"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

Verify that `git status` does **not** track `.env` or `task-tracker.json`.

---

## 📁 Project Directory Structure

```text
os V2/
├── .env                         # Server environment configuration (Git-ignored)
├── .env.example                 # Public environment template
├── .gitignore                   # Excludes node_modules, .env, task-tracker.json, logs
├── package.json                 # Node.js project manifest & scripts
├── server.js                    # Express static file server & Task Tracking API
├── start.bat                    # One-click Windows startup batch script
├── task-tracker.json            # Private user learning progress data (Git-ignored)
├── README.md                    # Comprehensive documentation
└── public/
    ├── index.html               # Main dashboard application HTML
    ├── css/
    │   ├── theme.css            # Dark/Light color tokens & typography
    │   ├── main.css             # Navigation, buttons, layout, code & log boxes
    │   ├── sync.css             # Process sync stages (Buffer, Philosophers, Barber)
    │   └── memory.css           # Memory bar, paging pipeline, fragmentation diagrams
    └── js/
        ├── app.js               # Main orchestrator, tabs, themes & tracker bridge
        ├── api.js               # REST client for task progress and health checks
        ├── data/
        │   └── pseudocode.js    # C code snippets, semaphore specs & invariant text
        ├── sync/
        │   ├── producer-consumer.js     # Bounded buffer simulation
        │   ├── readers-writers.js       # Reader-preference protocol simulation
        │   ├── dining-philosophers.js   # Circular table & deadlock avoidance
        │   └── sleeping-barber.js       # Barber rendezvous & queueing
        └── memory/
            ├── contiguous.js            # First/Best/Worst fit & compaction
            ├── paging.js                # MMU address translator & page fault handler
            ├── segmentation.js          # Segment table base/limit validation
            └── fragmentation.js         # Internal vs external fragmentation model
```

---

## 📖 Theoretical Concepts Covered

| Category | Concept | Key Mechanism |
| :--- | :--- | :--- |
| **Sync** | Critical Section | Mutual exclusion, progress, bounded waiting |
| **Sync** | Semaphores | Atomic `wait()` and `signal()` operations |
| **Sync** | Deadlock Prevention | Breaking Coffman's circular wait condition |
| **Sync** | Capacity Balking | Queue overflow handling in finite buffer models |
| **Memory** | Contiguous Fit | First Fit (fastest), Best Fit (tightest), Worst Fit (largest residual) |
| **Memory** | Compaction | Memory defragmentation via dynamic relocation |
| **Memory** | Paging | Hardware MMU page table lookup ($p \to f$) and frame offset preservation |
| **Memory** | Page Fault | OS kernel trap triggering disk page swap |
| **Memory** | Segmentation | User-centric logical addressing with base/limit protection registers |
| **Memory** | Fragmentation | Internal (unused slot space) vs External (scattered free holes) |

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).

