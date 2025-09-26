// Fitness Tracker Dashboard
// LocalStorage based simple tracker

const qs = sel => document.querySelector(sel);
const storage = {
  get(k, def){ const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; },
  set(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
};

// State
let workouts = storage.get('ft_workouts', []);
let weeklyGoal = storage.get('ft_goal', null);

// Elements
const form = qs('#workoutForm');
const tbody = qs('#logTable tbody');
const goalInput = qs('#goalInput');
const goalDisplay = qs('#goalDisplay');
const saveGoalBtn = qs('#saveGoal');
const clearAllBtn = qs('#clearAll');
const goalSummary = qs('#goalSummary');

// Chart.js setup
const ctx = qs('#calChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: { labels: [], datasets: [{ label: 'Calories', data: [], tension: 0.2, fill: true }] },
  options: {
    responsive: true,
    plugins:{ legend: { display: false } },
    scales: { x: { title: { display: true, text: 'Date' } }, y: { beginAtZero: true } }
  }
});

// Render functions
function renderTable(){
  tbody.innerHTML = '';
  const sorted = [...workouts].sort((a,b)=> b.date.localeCompare(a.date));
  if(sorted.length === 0){
    tbody.innerHTML = '<tr><td colspan="4" class="tiny-muted">No workouts logged yet</td></tr>';
    return;
  }
  for(const w of sorted){
    const tr = document.createElement('tr');
    tr.innerHTML = <td>${w.date}</td><td>${escapeHTML(w.type)}</td><td>${w.duration}</td><td>${w.calories}</td>;
    tbody.appendChild(tr);
  }
}

function escapeHTML(s){ 
  return String(s).replace(/[&<>"']/g, c => (
    {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]
  ));
}

function renderGoal(){
  if(weeklyGoal && weeklyGoal > 0){
    goalDisplay.textContent = ${weeklyGoal} cal/week;
    goalInput.value = weeklyGoal;
  } else {
    goalDisplay.textContent = 'No goal set';
    goalInput.value = '';
  }
}

function dailyTotals(days=14){
  const map = new Map();
  const today = new Date();
  for(let i=0;i<days;i++){
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - i));
    const key = d.toISOString().slice(0,10);
    map.set(key, 0);
  }
  for(const w of workouts){
    if(map.has(w.date)) map.set(w.date, map.get(w.date) + Number(w.calories || 0));
  }
  return Array.from(map.entries());
}

function renderChart(){
  const data = dailyTotals(14);
  chart.data.labels = data.map(d => d[0].slice(5));
  chart.data.datasets[0].data = data.map(d => d[1]);
  chart.update();
}

function renderGoalSummary(){
  if(!weeklyGoal){ goalSummary.textContent = ''; return; }
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // sunday
  const weekKey = d => d.toISOString().slice(0,10);
  let total = 0;
  for(const w of workouts){
    const d = new Date(w.date);
    if(d >= weekStart && d <= now) total += Number(w.calories||0);
  }
  goalSummary.textContent = This week: ${total}/${weeklyGoal} cal;
}

// Handlers
form.onsubmit = e => {
  e.preventDefault();
  const entry = {
    date: form.date.value,
    type: form.type.value.trim(),
    duration: Number(form.duration.value),
    calories: Number(form.calories.value)
  };
  workouts.push(entry);
  storage.set('ft_workouts', workouts);
  form.reset();
  renderAll();
};

saveGoalBtn.onclick = () => {
  const val = Number(goalInput.value);
  weeklyGoal = val > 0 ? val : null;
  storage.set('ft_goal', weeklyGoal);
  renderGoal();
  renderGoalSummary();
};

clearAllBtn.onclick = () => {
  if(confirm("Clear all workouts?")){
    workouts = [];
    storage.set('ft_workouts', workouts);
    renderAll();
  }
};

// Render all
function renderAll(){
  renderTable();
  renderGoal();
  renderChart();
  renderGoalSummary();
}

// Initial render
renderAll();