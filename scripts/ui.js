import { tasks, currentSort, sortTasks, addTask, updateTask, deleteTask, setSettings, settings } from './state.js';
import { compileRegex, highlight } from './search.js';
import { validateTitle, validateDueDate, validateDuration, validateTag } from './validators.js';

const tasksTableBody = document.querySelector('#tasksTable tbody');
const form = document.querySelector('#taskForm');
const titleInput = document.querySelector('#titleInput');
const dueDateInput = document.querySelector('#dueDateInput');
const durationInput = document.querySelector('#durationInput');
const tagInput = document.querySelector('#tagInput');
const taskIdInput = document.querySelector('#taskId');
const formTitle = document.querySelector('#formTitle');
const saveBtn = document.querySelector('#saveBtn');
const cancelBtn = document.querySelector('#cancelBtn');
const searchInput = document.querySelector('#searchInput');

const errorTitle = document.querySelector('#titleError');
const errorDueDate = document.querySelector('#dueDateError');
const errorDuration = document.querySelector('#durationError');
const errorTag = document.querySelector('#tagError');

const statsDiv = document.querySelector('#stats');

const settingsForm = document.querySelector('#settingsForm');
const durationUnitSelect = document.querySelector('#durationUnitSelect');
const tagPresetsInput = document.querySelector('#tagPresetsInput');

let durationChartInstance = null;

function clearErrors() {
  errorTitle.textContent = '';
  errorDueDate.textContent = '';
  errorDuration.textContent = '';
  errorTag.textContent = '';
}

function validateForm() {
  let valid = true;
  clearErrors();

  if (!validateTitle(titleInput.value)) {
    errorTitle.textContent = 'Title required, no leading/trailing spaces.';
    valid = false;
  }
  if (!validateDueDate(dueDateInput.value)) {
    errorDueDate.textContent = 'Invalid due date format (YYYY-MM-DD).';
    valid = false;
  }
  if (!validateDuration(durationInput.value)) {
    errorDuration.textContent = 'Duration must be a non-negative number with up to 2 decimals.';
    valid = false;
  }
  if (!validateTag(tagInput.value)) {
    errorTag.textContent = 'Tag must contain only letters, spaces, or hyphens.';
    valid = false;
  }
  return valid;
}

function resetForm() {
  form.reset();
  taskIdInput.value = '';
  formTitle.textContent = 'Add Task';
  clearErrors();
}

function renderDurationChart() {
  const canvas = document.getElementById('durationChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Aggregate total duration by tag
  const tagDurations = {};
  tasks.forEach(task => {
    tagDurations[task.tag] = (tagDurations[task.tag] || 0) + Number(task.duration);
  });

  const labels = Object.keys(tagDurations);
  const data = Object.values(tagDurations);

  if (durationChartInstance) {
    durationChartInstance.data.labels = labels;
    durationChartInstance.data.datasets[0].data = data;
    durationChartInstance.update();
  } else {
    durationChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: `Total Duration (${settings.durationUnit})`,
          data,
          backgroundColor: 'rgba(54, 162, 235, 0.6)'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true, position: 'top' },
          title: { display: true, text: 'Task Duration by Tag' },
          accessibility: {
            enabled: true
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: settings.durationUnit }
          }
        }
      }
    });
  }
}

function renderTasks() {
  tasksTableBody.innerHTML = '';

  let filteredTasks = tasks;

  if (searchInput.value.trim() !== '') {
    const re = compileRegex(searchInput.value);
    if (re) {
      filteredTasks = tasks.filter(task =>
        re.test(task.title) ||
        re.test(task.dueDate) ||
        re.test(String(task.duration)) ||
        re.test(task.tag)
      );
    } 
  }

  filteredTasks.forEach(task => {
    const tr = document.createElement('tr');
    tr.tabIndex = 0;

    const titleTd = document.createElement('td');
    titleTd.innerHTML = highlight(task.title, compileRegex(searchInput.value));
    tr.appendChild(titleTd);

    const dueDateTd = document.createElement('td');
    dueDateTd.innerHTML = highlight(task.dueDate, compileRegex(searchInput.value));
    tr.appendChild(dueDateTd);

    const durationValue = settings.durationUnit === 'hours' ? (task.duration / 60).toFixed(2) : task.duration;
    const durationTd = document.createElement('td');
    durationTd.innerHTML = highlight(String(durationValue), compileRegex(searchInput.value));
    tr.appendChild(durationTd);

    const tagTd = document.createElement('td');
    tagTd.innerHTML = highlight(task.tag, compileRegex(searchInput.value));
    tr.appendChild(tagTd);

    const actionsTd = document.createElement('td');

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => {
      taskIdInput.value = task.id;
      titleInput.value = task.title;
      dueDateInput.value = task.dueDate;
      durationInput.value = task.duration;
      tagInput.value = task.tag;
      formTitle.textContent = 'Edit Task';
      titleInput.focus();
    });
    actionsTd.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
      if (confirm(`Delete task "${task.title}"?`)) {
        deleteTask(task.id);
        renderTasks();
        renderStats();
        resetForm();
      }
    });
    actionsTd.appendChild(deleteBtn);

    tr.appendChild(actionsTd);

    tasksTableBody.appendChild(tr);
  });
}

function renderStats() {
  const totalTasks = tasks.length;
  let totalDurationMinutes = tasks.reduce((sum, t) => sum + Number(t.duration), 0);

  if (settings.durationUnit === 'hours') {
    totalDurationMinutes /= 60;
  }

  let tagCounts = {};
  tasks.forEach(t => {
    if (!tagCounts[t.tag]) tagCounts[t.tag] = 0;
    tagCounts[t.tag]++;
  });

  const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

  statsDiv.innerHTML = `
    <p>Total tasks: ${totalTasks}</p>
    <p>Total duration: ${totalDurationMinutes.toFixed(2)} ${settings.durationUnit}</p>
    <p>Top tag: ${topTag}</p>
  `;

  renderDurationChart();
}

function saveTask(event) {
  event.preventDefault();

  if (!validateForm()) return;

  const id = taskIdInput.value || `rec_${Date.now()}`;
  const newTask = {
    id,
    title: titleInput.value.trim(),
    dueDate: dueDateInput.value,
    duration: parseFloat(durationInput.value),
    tag: tagInput.value.trim(),
    createdAt: taskIdInput.value ? tasks.find(t => t.id === id).createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (taskIdInput.value) {
    updateTask(newTask);
  } else {
    addTask(newTask);
  }
  renderTasks();
  renderStats();
  resetForm();
}

function cancelEdit() {
  resetForm();
}

function bindEvents() {
  searchInput.addEventListener('input', () => renderTasks());

  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      sortTasks(th.dataset.sort);
      renderTasks();
      updateSortIndicators();
    });
    th.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        sortTasks(th.dataset.sort);
        renderTasks();
        updateSortIndicators();
      }
    });
  });

  form.addEventListener('submit', saveTask);
  cancelBtn.addEventListener('click', cancelEdit);

  settingsForm.addEventListener('submit', e => {
    e.preventDefault();
    setSettings({
      durationUnit: durationUnitSelect.value,
      tagPresets: tagPresetsInput.value
    });
    renderTasks();
    renderStats();
  });
}

function updateSortIndicators() {
  document.querySelectorAll('th[data-sort]').forEach(th => {
    if (currentSort.key === th.dataset.sort) {
      th.setAttribute('aria-sort', currentSort.direction === 'asc' ? 'ascending' : 'descending');
    } else {
      th.removeAttribute('aria-sort');
    }
  });
}

function loadSettingsUI() {
  durationUnitSelect.value = settings.durationUnit;
  tagPresetsInput.value = settings.tagPresets;
}

export function initUI() {
  loadSettingsUI();
  renderTasks();
  renderStats();
  updateSortIndicators();
  bindEvents();
}