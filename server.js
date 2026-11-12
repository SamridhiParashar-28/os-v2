const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const TRACKER_FILE = path.join(__dirname, 'task-tracker.json');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Default task template if task-tracker.json is missing
const defaultTrackerData = {
  lastUpdated: new Date().toISOString(),
  overallProgress: 0,
  completedCount: 0,
  totalCount: 9,
  tasks: {
    sync_producer_consumer: {
      title: "Producer-Consumer Problem",
      category: "Process Synchronization",
      completed: false,
      notes: "Explored bounded buffer, mutex, full, and empty semaphores."
    },
    sync_readers_writers: {
      title: "Readers-Writers Problem",
      category: "Process Synchronization",
      completed: false,
      notes: "Understood reader-priority vs writer-priority and mutual exclusion."
    },
    sync_dining_philosophers: {
      title: "Dining Philosophers Problem",
      category: "Process Synchronization",
      completed: false,
      notes: "Simulated deadlock conditions and circular wait resolution."
    },
    sync_sleeping_barber: {
      title: "Sleeping Barber Problem",
      category: "Process Synchronization",
      completed: false,
      notes: "Observed customer queue, waiting chairs, and barber wake/sleep states."
    },
    mem_contiguous_fit: {
      title: "Contiguous Allocation (First/Best/Worst Fit)",
      category: "Memory Management",
      completed: false,
      notes: "Compared hole selection heuristics and external fragmentation."
    },
    mem_paging: {
      title: "Paging & Address Translation",
      category: "Memory Management",
      completed: false,
      notes: "Calculated page numbers, frame numbers, and offset addresses."
    },
    mem_segmentation: {
      title: "Segmentation & Protection",
      category: "Memory Management",
      completed: false,
      notes: "Examined Segment Table base/limit registers and segmentation faults."
    },
    mem_fragmentation: {
      title: "Internal & External Fragmentation + Compaction",
      category: "Memory Management",
      completed: false,
      notes: "Analyzed wasted memory spaces and compaction process."
    },
    mem_page_replacement: {
      title: "Page Replacement (FIFO & LRU)",
      category: "Memory Management",
      completed: false,
      notes: "Simulated frame allocation, page hits, and victim page eviction."
    }
  }
};

// Helper: read tracker
function readTracker() {
  try {
    if (!fs.existsSync(TRACKER_FILE)) {
      fs.writeFileSync(TRACKER_FILE, JSON.stringify(defaultTrackerData, null, 2), 'utf8');
      return defaultTrackerData;
    }
    const raw = fs.readFileSync(TRACKER_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading task-tracker.json:', err.message);
    return defaultTrackerData;
  }
}

// Helper: write tracker
function writeTracker(data) {
  try {
    const total = Object.keys(data.tasks || {}).length;
    const completed = Object.values(data.tasks || {}).filter(t => t.completed).length;
    data.totalCount = total;
    data.completedCount = completed;
    data.overallProgress = total > 0 ? Math.round((completed / total) * 100) : 0;
    data.lastUpdated = new Date().toISOString();

    fs.writeFileSync(TRACKER_FILE, JSON.stringify(data, null, 2), 'utf8');
    return data;
  } catch (err) {
    console.error('Error writing task-tracker.json:', err.message);
    return null;
  }
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: process.env.APP_NAME || 'Process Synchronization & Memory Management Visualizer',
    version: process.env.APP_VERSION || '1.0.0',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/progress', (req, res) => {
  const data = readTracker();
  res.json(data);
});

app.post('/api/progress/toggle', (req, res) => {
  const { taskId, completed } = req.body;
  if (!taskId) {
    return res.status(400).json({ error: 'Missing taskId in request body' });
  }

  const tracker = readTracker();
  if (tracker.tasks && tracker.tasks[taskId]) {
    tracker.tasks[taskId].completed = typeof completed === 'boolean' 
      ? completed 
      : !tracker.tasks[taskId].completed;
  } else {
    // If dynamic task is passed
    tracker.tasks = tracker.tasks || {};
    tracker.tasks[taskId] = {
      title: req.body.title || taskId,
      category: req.body.category || 'General',
      completed: true,
      notes: req.body.notes || 'Completed via visualizer.'
    };
  }

  const updated = writeTracker(tracker);
  if (!updated) {
    return res.status(500).json({ error: 'Failed to persist tracker state' });
  }

  res.json({ success: true, tracker: updated });
});

app.post('/api/progress/reset', (req, res) => {
  const tracker = readTracker();
  Object.keys(tracker.tasks || {}).forEach(k => {
    tracker.tasks[k].completed = false;
  });
  const updated = writeTracker(tracker);
  res.json({ success: true, tracker: updated });
});

// Fallback to index.html for single-page style navigation
app.get('*', (req, res) => {
  if (fs.existsSync(path.join(__dirname, 'index.html'))) {
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// Start server
app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`=======================================================`);
  console.log(` OS Visualizer Server running at: ${url}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Task Tracker: ${TRACKER_FILE} (Private & Git-Ignored)`);
  console.log(`=======================================================`);

  // Automatically launch browser when server starts listening
  try {
    if (process.platform === 'win32') {
      exec(`start ${url}`);
    } else if (process.platform === 'darwin') {
      exec(`open ${url}`);
    } else {
      exec(`xdg-open ${url}`);
    }
  } catch (err) {
    console.log(`Open your browser and navigate to: ${url}`);
  }
});

