import { loadData, saveData, loadSettings, saveSettings } from './storage.js';

export let tasks = loadData();
export let settings = loadSettings();

export let currentSort = { key: 'dueDate', direction: 'asc' };

export function addTask(task) {
  tasks.push(task);
  saveData(tasks);
}

export function updateTask(updatedTask) {
  const index = tasks.findIndex(t => t.id === updatedTask.id);
  if (index !== -1) {
    tasks[index] = updatedTask;
    saveData(tasks);
  }
}

export function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveData(tasks);
}

export function setSettings(newSettings) {
  settings = newSettings;
  saveSettings(settings);
}

export function sortTasks(key) {
  if (currentSort.key === key) {
    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    currentSort.key = key;
    currentSort.direction = 'asc';
  }
  tasks.sort((a, b) => {
    const valA = a[key];
    const valB = b[key];
    if (key === 'duration') {
      return currentSort.direction === 'asc' ? valA - valB : valB - valA;
    }
    if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
    if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
    return 0;
  });
  saveData(tasks);
} 