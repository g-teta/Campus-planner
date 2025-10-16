import { initUI } from './ui.js';
import { initData, loadData, saveData, importJson, exportJson, loadSettings, saveSettings } from './storage.js';
import { compileRegex, validators } from './validators.js';

const qs = id => document.getElementById(id);
let chart = null;
let sortState = { key: 'dueDate', dir: 'asc' };

/* helpers */
function createId() { return `rec_${Date.now().toString(36)}`; }
function fmtDate(d) { if (!d) return ''; const dt = new Date(d); return isNaN(dt) ? d : dt.toISOString().slice(0,10); }
function escapeHtml(s = '') { return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function download(filename, text) {
  const a = document.createElement('a');
  const blob = new Blob([text], { type: 'application/json' });
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* renderers */
function renderStats(tasks) {
  const stats = qs('stats');
  if (!stats) return;
  const total = tasks.length;
  const totalMinutes = tasks.reduce((s,t) => s + (Number(t.duration)||0), 0);
  const tags = {};
  tasks.forEach(t => tags[t.tag] = (tags[t.tag]||0) + 1);
  const topTag = Object.keys(tags).sort((a,b) => tags[b]-tags[a])[0] || '—';
  stats.innerHTML = `
    <p>Total tasks: ${total}</p>
    <p>Total duration: ${totalMinutes} minutes</p>
    <p>Top tag: ${topTag}</p>
  `;
}

function updateChart(tasks) {
  const canvas = qs('durationChart');
  if (!canvas || typeof Chart === 'undefined') return;
  const ctx = canvas.getContext('2d');
  const sorted = [...tasks].slice(0,10);
  const labels = sorted.map(t => t.title || t.id);
  const data = sorted.map(t => Number(t.duration) || 0);
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Duration (min)', data, backgroundColor: 'rgba(54,162,235,0.6)' }] },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero:true } } }
  });
}

function highlightText(text, re) {
  if (!re) return escapeHtml(text);
  return escapeHtml(text).replace(new RegExp(re.source, re.flags), (m) => `<mark>${escapeHtml(m)}</mark>`);
}

function renderTable(tasks, re = null) {
  const tbody = document.querySelector('#tasksTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  tasks.forEach(t => {
    const tr = document.createElement('tr');

    const tdTitle = document.createElement('td');
    tdTitle.innerHTML = highlightText(t.title || '', re);
    tr.appendChild(tdTitle);

    const tdDate = document.createElement('td');
    tdDate.textContent = fmtDate(t.dueDate);
    tr.appendChild(tdDate);

    const tdDur = document.createElement('td');
    tdDur.textContent = String(t.duration ?? '');
    tr.appendChild(tdDur);

    const tdTag = document.createElement('td');
    tdTag.textContent = t.tag || '';
    tr.appendChild(tdTag);

    const tdActions = document.createElement('td');
    const edit = document.createElement('button');
    edit.textContent = 'Edit';
    edit.addEventListener('click', () => populateForm(t.id));
    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.addEventListener('click', () => {
      if (!confirm('Delete this task?')) return;
      const remaining = loadData().filter(x => x.id !== t.id);
      saveData(remaining);
    });
    tdActions.appendChild(edit);
    tdActions.appendChild(del);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  });
}

/* sorting */
function sortTasks(tasks) {
  const keyed = [...tasks].sort((a,b) => {
    const k = sortState.key;
    let va = a[k] ?? '', vb = b[k] ?? '';
    if (k === 'duration') { va = Number(va)||0; vb = Number(vb)||0; }
    if (k === 'dueDate') { va = new Date(va); vb = new Date(vb); }
    if (va < vb) return sortState.dir === 'asc' ? -1 : 1;
    if (va > vb) return sortState.dir === 'asc' ? 1 : -1;
    return 0;
  });
  return keyed;
}

/* form handling */
function resetForm() {
  const f = qs('taskForm');
  if (!f) return;
  f.reset();
  qs('taskId').value = '';
  qs('formTitle').textContent = 'Add Task';
  ['titleError','dueDateError','durationError','tagError','searchHelp'].forEach(id => {
    const el = qs(id); if (el) { el.textContent = id === 'searchHelp' ? 'Case-insensitive, live updates. Invalid regex handled.' : ''; }
  });
}

function populateForm(id) {
  const tasks = loadData();
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  qs('taskId').value = t.id;
  qs('titleInput').value = t.title || '';
  qs('dueDateInput').value = fmtDate(t.dueDate);
  qs('durationInput').value = String(t.duration ?? '');
  qs('tagInput').value = t.tag || '';
  qs('formTitle').textContent = 'Edit Task';
  qs('titleInput').focus();
}

function saveFromForm(e) {
  e?.preventDefault();
  const id = qs('taskId').value;
  const title = qs('titleInput').value.trim();
  const dueDate = qs('dueDateInput').value;
  const duration = qs('durationInput').value;
  const tag = qs('tagInput').value.trim();

  let ok = true;
  if (!validators.title(title)) { qs('titleError').textContent = 'Invalid title'; ok = false; } else qs('titleError').textContent = '';
  if (!validators.dateISO(dueDate)) { qs('dueDateError').textContent = 'Invalid date (YYYY-MM-DD)'; ok = false; } else qs('dueDateError').textContent = '';
  if (!validators.duration(duration)) { qs('durationError').textContent = 'Invalid duration'; ok = false; } else qs('durationError').textContent = '';
  if (!validators.tag(tag)) { qs('tagError').textContent = 'Invalid tag'; ok = false; } else qs('tagError').textContent = '';
  if (!validators.noDuplicateWords(title)) { qs('titleError').textContent = 'Title contains duplicate words'; ok = false; }

  if (!ok) return;

  const tasks = loadData();
  const now = new Date().toISOString();
  if (id) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx >= 0) {
      tasks[idx] = { ...tasks[idx], title, dueDate, duration: Number(duration), tag, updatedAt: now };
    }
  } else {
    tasks.push({ id: createId(), title, dueDate, duration: Number(duration), tag, createdAt: now, updatedAt: now });
  }
  saveData(tasks);
  resetForm();
}

/* search + render pipeline */
function applySearch() {
  const q = (qs('searchInput')?.value || '').trim();
  let re = null;
  if (q) {
    re = compileRegex(q, 'gi');
    if (!re) qs('searchHelp').textContent = 'Invalid regex — showing all results.';
    else qs('searchHelp').textContent = 'Case-insensitive, live updates. Invalid regex handled.';
  } else {
    qs('searchHelp').textContent = 'Case-insensitive, live updates. Invalid regex handled.';
  }

  let tasks = loadData();
  if (re) {
    tasks = tasks.filter(t => re.test(t.title || '') || re.test(t.tag || ''));
    // reset lastIndex for global regex
    re.lastIndex = 0;
  }
  tasks = sortTasks(tasks);
  renderTable(tasks, re);
  renderStats(tasks);
  updateChart(tasks);
}

/* import/export */
function wireImportExport() {
  const importBtn = qs('importBtn');
  const importFile = qs('importFile');
  const exportBtn = qs('exportBtn');
  const clearBtn = qs('clearBtn');

  if (importBtn && importFile) {
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', async (ev) => {
      const f = ev.target.files?.[0];
      if (!f) return;
      const text = await f.text();
      const res = importJson(text);
      if (res.ok) {
        alert('Imported ' + res.data.length + ' records.');
      } else {
        alert('Import error: ' + res.error);
      }
      importFile.value = '';
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const text = exportJson();
      download('campus_planner_export.json', text);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (!confirm('Clear all records?')) return;
      saveData([]);
    });
  }
}

/* sorting UI wiring */
function wireSortingHeaders() {
  document.querySelectorAll('#tasksTable thead th[data-sort]').forEach(th => {
    th.setAttribute('tabindex', '0');
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (sortState.key === key) sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
      else { sortState.key = key; sortState.dir = 'asc'; }
      applySearch();
    });
    th.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); th.click(); } });
  });
}

/* init */
async function boot() {
  // wire form
  qs('taskForm')?.addEventListener('submit', saveFromForm);
  qs('cancelBtn')?.addEventListener('click', (e) => { e.preventDefault(); resetForm(); });

  // search
  qs('searchInput')?.addEventListener('input', () => applySearch());

  // settings
  qs('settingsForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const s = { durationUnit: qs('durationUnitSelect')?.value || 'minutes', tagPresets: qs('tagPresetsInput')?.value || '' };
    saveSettings(s);
    alert('Settings saved');
  });
  const settings = loadSettings();
  if (settings) {
    if (qs('durationUnitSelect')) qs('durationUnitSelect').value = settings.durationUnit || 'minutes';
    if (qs('tagPresetsInput')) qs('tagPresetsInput').value = settings.tagPresets || '';
  }

  // wire import/export and sorting UI
  wireImportExport();
  wireSortingHeaders();

  // storage events
  document.addEventListener('tasksUpdated', applySearch);
  document.addEventListener('dataInitialized', applySearch);
  document.addEventListener('tasksLoaded', applySearch);

  // init
  await initData();
  applySearch();
}

document.addEventListener('DOMContentLoaded', boot);