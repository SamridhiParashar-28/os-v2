// API Service for Process Synchronization & Memory Management Visualizer

const VisualizerAPI = {
  // Check backend server health
  async checkHealth() {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('Health check non-200');
      return await res.json();
    } catch (err) {
      console.warn('API health check offline, using local fallback:', err.message);
      return { status: 'fallback', uptimeSeconds: 0 };
    }
  },

  // Fetch task progress from task-tracker.json
  async getProgress() {
    try {
      const res = await fetch('/api/progress');
      if (!res.ok) throw new Error('Failed to load progress from server');
      const data = await res.json();
      localStorage.setItem('os_visualizer_backup', JSON.stringify(data));
      return data;
    } catch (err) {
      console.warn('Backend unavailable, reading from localStorage backup:', err.message);
      const backup = localStorage.getItem('os_visualizer_backup');
      if (backup) {
        return JSON.parse(backup);
      }
      return {
        overallProgress: 0,
        completedCount: 0,
        totalCount: 8,
        tasks: {}
      };
    }
  },

  // Toggle or mark a task completed
  async toggleTask(taskId, completed, title, category) {
    try {
      const res = await fetch('/api/progress/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, completed, title, category })
      });
      if (!res.ok) throw new Error('Server returned error on toggle');
      const json = await res.json();
      localStorage.setItem('os_visualizer_backup', JSON.stringify(json.tracker));
      return json.tracker;
    } catch (err) {
      console.warn('Saving task progress locally due to server error:', err.message);
      let backup = JSON.parse(localStorage.getItem('os_visualizer_backup') || '{"tasks":{}}');
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
    }
  },

  // Reset all tasks
  async resetTasks() {
    try {
      const res = await fetch('/api/progress/reset', { method: 'POST' });
      const json = await res.json();
      localStorage.setItem('os_visualizer_backup', JSON.stringify(json.tracker));
      return json.tracker;
    } catch (err) {
      let backup = JSON.parse(localStorage.getItem('os_visualizer_backup') || '{"tasks":{}}');
      Object.keys(backup.tasks || {}).forEach(k => backup.tasks[k].completed = false);
      backup.completedCount = 0;
      backup.overallProgress = 0;
      localStorage.setItem('os_visualizer_backup', JSON.stringify(backup));
      return backup;
    }
  }
};

window.VisualizerAPI = VisualizerAPI;

