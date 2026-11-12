// API Service for Process Synchronization & Memory Management Visualizer

const isStaticHost = typeof window !== 'undefined' && (
  window.location.protocol === 'file:' ||
  window.location.hostname.includes('github.io') ||
  window.location.port === ''
);

const VisualizerAPI = {
  // Check backend server health
  async checkHealth() {
    if (isStaticHost) {
      return { status: 'static_mode', app: 'Process Synchronization & Memory Management Visualizer', version: '1.0.0' };
    }
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('Health check non-200');
      return await res.json();
    } catch (err) {
      return { status: 'fallback', uptimeSeconds: 0 };
    }
  },

  // Fetch task progress from task-tracker.json or localStorage
  async getProgress() {
    if (isStaticHost) {
      return this.getLocalProgress();
    }
    try {
      const res = await fetch('/api/progress');
      if (!res.ok) throw new Error('Failed to load progress from server');
      const data = await res.json();
      localStorage.setItem('os_visualizer_backup', JSON.stringify(data));
      return data;
    } catch (err) {
      return this.getLocalProgress();
    }
  },

  getLocalProgress() {
    const backup = localStorage.getItem('os_visualizer_backup');
    if (backup) {
      try { return JSON.parse(backup); } catch(e) {}
    }
    return {
      overallProgress: 0,
      completedCount: 0,
      totalCount: 9,
      tasks: {}
    };
  },

  // Toggle or mark a task completed
  async toggleTask(taskId, completed, title, category) {
    if (!isStaticHost) {
      try {
        const res = await fetch('/api/progress/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId, completed, title, category })
        });
        if (res.ok) {
          const json = await res.json();
          localStorage.setItem('os_visualizer_backup', JSON.stringify(json.tracker));
          return json.tracker;
        }
      } catch (err) {
        // Fall through to local storage
      }
    }

    let backup = this.getLocalProgress();
    if (!backup.tasks) backup.tasks = {};
    if (!backup.tasks[taskId]) {
      backup.tasks[taskId] = { completed: true, title: title || taskId, category: category || 'OS' };
    } else {
      backup.tasks[taskId].completed = typeof completed === 'boolean' ? completed : !backup.tasks[taskId].completed;
    }
    const total = Object.keys(backup.tasks).length;
    const done = Object.values(backup.tasks).filter(t => t.completed).length;
    backup.totalCount = total;
    backup.completedCount = done;
    backup.overallProgress = total > 0 ? Math.round((done / total) * 100) : 0;
    localStorage.setItem('os_visualizer_backup', JSON.stringify(backup));
    return backup;
  },

  // Reset all tasks
  async resetTasks() {
    if (!isStaticHost) {
      try {
        const res = await fetch('/api/progress/reset', { method: 'POST' });
        if (res.ok) {
          const json = await res.json();
          localStorage.setItem('os_visualizer_backup', JSON.stringify(json.tracker));
          return json.tracker;
        }
      } catch (err) {
        // Fall through
      }
    }

    let backup = this.getLocalProgress();
    Object.keys(backup.tasks || {}).forEach(k => backup.tasks[k].completed = false);
    backup.completedCount = 0;
    backup.overallProgress = 0;
    localStorage.setItem('os_visualizer_backup', JSON.stringify(backup));
    return backup;
  }
};

window.VisualizerAPI = VisualizerAPI;
