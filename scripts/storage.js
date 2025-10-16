const STORAGE_KEY = 'campusLifePlanner:data';
const SETTINGS_KEY = 'campusLifePlanner:settings';

export function loadData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveData(tasks) {
  // ensure timestamps for each record
  const now = new Date().toISOString();
  const withTimestamps = tasks.map(t => {
    if (!t.createdAt) t.createdAt = now;
    t.updatedAt = now;
    return t;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(withTimestamps));
  try { document.dispatchEvent(new CustomEvent('tasksUpdated', { detail: withTimestamps })); } catch {}
}

// import JSON string (validated by caller)
export function importJson(jsonString) {
  try {
    const arr = JSON.parse(jsonString);
    if (!Array.isArray(arr)) throw new Error('Imported JSON must be an array');
    // basic shape validation: must have id, title, dueDate, duration, tag
    const validated = arr.map(item => ({
      id: item.id || `rec_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
      title: item.title || '',
      dueDate: item.dueDate || '',
      duration: Number(item.duration) || 0,
      tag: item.tag || '',
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    saveData(validated);
    return { ok:true, data: validated };
  } catch (err) {
    return { ok:false, error: String(err) };
  }
}

export function exportJson() {
  return localStorage.getItem(STORAGE_KEY) || '[]';
}

export function loadSettings() {
  try {
    const settings = localStorage.getItem(SETTINGS_KEY);
    return settings ? JSON.parse(settings) : { durationUnit: 'minutes', tagPresets: '' };
  } catch {
    return { durationUnit: 'minutes', tagPresets: '' };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  try {
    document.dispatchEvent(new CustomEvent('settingsUpdated', { detail: settings }));
  } catch (e) {}
}

/**
 * initData()
 * - if no tasks in localStorage, fetch /assets/seed.json and save it
 * - always dispatch an event so the UI/dashboard can react
 * - returns the tasks array
 */
export async function initData() {
  const existing = loadData();
  if (existing && existing.length) {
    try { document.dispatchEvent(new CustomEvent('tasksLoaded', { detail: existing })); } catch {}
    return existing;
  }

  try {
    const resp = await fetch('/assets/seed.json', { cache: 'no-store' });
    if (!resp.ok) throw new Error('seed fetch failed: ' + resp.status);
    const seed = await resp.json();
    saveData(seed);
    try { document.dispatchEvent(new CustomEvent('dataInitialized', { detail: seed })); } catch {}
    return seed;
  } catch (err) {
    console.warn('initData: could not load seed.json', err);
    saveData([]); // initialize with empty array
    return [];
  }
}