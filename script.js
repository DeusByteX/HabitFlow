let habits = JSON.parse(localStorage.getItem('habitflow_data')) || [];

const progressCircle = document.getElementById('progress-circle');
const progressPercent = document.getElementById('progress-percent');
const progressSummary = document.getElementById('progress-summary');
const habitsList = document.getElementById('habits-list');
const emptyState = document.getElementById('empty-state');
const addHabitBtn = document.getElementById('add-habit-btn');
const addHabitModal = document.getElementById('add-habit-modal');
const closeModal = document.getElementById('close-modal');
const habitForm = document.getElementById('habit-form');
const habitCount = document.getElementById('habit-count');
const bestStreakEl = document.getElementById('best-streak');
const totalCompletedEl = document.getElementById('total-completed');
const totalHabitsEl = document.getElementById('total-habits');
const streakDaysEl = document.getElementById('streak-days');
const achievementsList = document.getElementById('achievements-list');

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

function isToday(dateStr) {
  return dateStr === getTodayKey();
}

function getConsecutiveStreak(history) {
  if (!history || history.length === 0) return 0;
  const sorted = [...history].sort((a, b) => new Date(b) - new Date(a));
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sorted.length; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const checkKey = `${checkDate.getFullYear()}-${checkDate.getMonth() + 1}-${checkDate.getDate()}`;
    if (sorted.includes(checkKey)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function getBestStreak(history) {
  if (!history || history.length === 0) return 0;
  const sorted = [...history].sort((a, b) => new Date(a) - new Date(b));
  let best = 0;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      current++;
    } else {
      best = Math.max(best, current);
      current = 1;
    }
  }
  best = Math.max(best, current);
  return best;
}

function getOverallStreak() {
  if (habits.length === 0) return 0;
  const todayKey = getTodayKey();
  const allCompletedToday = habits.every(h => h.history && h.history.includes(todayKey));
  if (!allCompletedToday) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const checkKey = `${checkDate.getFullYear()}-${checkDate.getMonth() + 1}-${checkDate.getDate()}`;
    const allDone = habits.every(h => h.history && h.history.includes(checkKey));
    if (allDone) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function getCategoryColor(category) {
  const colors = {
    Health: { bg: 'rgba(34,197,94,0.1)', text: '#22c55e' },
    Learning: { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6' },
    Mindfulness: { bg: 'rgba(168,85,247,0.1)', text: '#a855f7' },
    Productivity: { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
    Fitness: { bg: 'rgba(239,68,68,0.1)', text: '#ef4444' }
  };
  return colors[category] || colors.Health;
}

function init() {
  updateDateTime();
  renderHabits();
  updateProgress();
  renderWeeklyChart();
  updateStats();
  updateAchievements();
  setupEventListeners();
}

function updateDateTime() {
  const now = new Date();
  const options = { weekday: 'long', month: 'short', day: 'numeric' };
  const dateStr = now.toLocaleDateString('en-US', options);
  const el = document.getElementById('current-date');
  const badge = document.getElementById('current-date-badge');
  if (el) el.textContent = dateStr;
  if (badge) badge.textContent = dateStr;

  const hour = now.getHours();
  const greeting = document.getElementById('greeting');
  if (greeting) {
    if (hour < 12) greeting.innerHTML = 'Good morning! <span>☀️</span>';
    else if (hour < 18) greeting.innerHTML = 'Good afternoon! <span>🌤️</span>';
    else greeting.innerHTML = 'Good evening! <span>🌙</span>';
  }
}

function renderHabits() {
  if (!habitsList) return;
  habitsList.innerHTML = '';

  const todayKey = getTodayKey();

  if (habitCount) {
    habitCount.textContent = `${habits.length} ritual${habits.length !== 1 ? 's' : ''}`;
  }

  if (habits.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    if (window.lucide) lucide.createIcons();
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  const sorted = [...habits].sort((a, b) => {
    const aDone = a.history && a.history.includes(todayKey) ? 1 : 0;
    const bDone = b.history && b.history.includes(todayKey) ? 1 : 0;
    return aDone - bDone;
  });

  sorted.forEach(habit => {
    const isCompleted = habit.history && habit.history.includes(todayKey);
    const category = habit.category || 'Health';
    const consecutiveStreak = getConsecutiveStreak(habit.history || []);

    const habitEl = document.createElement('div');
    habitEl.className = 'habit-item';
    habitEl.setAttribute('data-category', category);

    habitEl.innerHTML = `
      <div class="habit-info">
        <div class="habit-check ${isCompleted ? 'completed' : ''}" onclick="toggleHabit('${habit.id}')">
          ${isCompleted ? '<i data-lucide="check" style="width:18px;height:18px;"></i>' : ''}
        </div>
        <div>
          <span class="habit-name" style="${isCompleted ? 'text-decoration:line-through;opacity:0.6;' : ''}">${habit.name}</span>
          <div class="habit-meta">
            <span class="habit-category">${category}</span>
            ${habit.frequency && habit.frequency !== 'daily' ? `<span class="habit-category" style="color:var(--text-muted);border-color:var(--border-light);background:var(--bg-surface);">${habit.frequency}</span>` : ''}
            <span class="streak-badge">
              <i data-lucide="flame" style="width:13px;height:13px;"></i>
              ${consecutiveStreak} day${consecutiveStreak !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
      <div class="habit-actions">
        <button class="delete-btn" onclick="deleteHabit('${habit.id}')" title="Delete habit">
          <i data-lucide="trash-2" style="width:18px;height:18px;"></i>
        </button>
      </div>
    `;

    habitsList.appendChild(habitEl);
  });

  if (window.lucide) lucide.createIcons();
}

function toggleHabit(id) {
  const habit = habits.find(h => h.id === id);
  if (!habit) return;

  const todayKey = getTodayKey();

  if (!habit.history) habit.history = [];
  if (!habit.streak) habit.streak = 0;
  if (!habit.lastCompletedDate) habit.lastCompletedDate = null;

  const wasCompleted = habit.history.includes(todayKey);

  if (wasCompleted) {
    habit.history = habit.history.filter(d => d !== todayKey);
    habit.lastCompletedDate = habit.history.length > 0 ? habit.history[habit.history.length - 1] : null;
  } else {
    if (!habit.history.includes(todayKey)) {
      habit.history.push(todayKey);
    }
    habit.lastCompletedDate = todayKey;

    triggerConfetti();
  }

  saveAndRefresh();

  setTimeout(() => {
    updateAchievements();
  }, 100);
}

function deleteHabit(id) {
  if (confirm('Delete this habit?')) {
    habits = habits.filter(h => h.id !== id);
    saveAndRefresh();
  }
}

function updateProgress() {
  if (!progressCircle || !progressPercent || !progressSummary) return;

  const total = habits.length;
  const todayKey = getTodayKey();

  if (total === 0) {
    setProgress(0);
    progressSummary.textContent = '0 of 0 habits completed';
    return;
  }

  const completed = habits.filter(h => h.history && h.history.includes(todayKey)).length;
  const percent = Math.round((completed / total) * 100);
  setProgress(percent);
  progressSummary.textContent = `${completed} of ${total} habits completed`;
}

function setProgress(percent) {
  const circumference = 408.41;
  const offset = circumference - (percent / 100) * circumference;
  progressCircle.style.strokeDashoffset = offset;
  progressPercent.textContent = `${percent}%`;
}

function renderWeeklyChart() {
  const chart = document.getElementById('weekly-chart');
  if (!chart) return;
  chart.innerHTML = '';

  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dayKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    const dayName = days[d.getDay()];

    let dayPercent = 0;
    const total = habits.length;
    if (total > 0) {
      const completed = habits.filter(h => h.history && h.history.includes(dayKey)).length;
      dayPercent = (completed / total) * 100;
    }

    const isToday = i === 0;

    const container = document.createElement('div');
    container.className = 'chart-bar-container';
    container.innerHTML = `
      <span class="chart-bar-value">${Math.round(dayPercent)}%</span>
      <div class="chart-bar ${isToday ? 'active' : ''}" style="height:${Math.max(4, dayPercent)}%;"></div>
      <span class="chart-label">${dayName}</span>
    `;
    chart.appendChild(container);
  }
}

function updateStats() {
  if (!bestStreakEl || !totalCompletedEl || !totalHabitsEl || !streakDaysEl) return;

  const todayKey = getTodayKey();

  const allBest = habits.map(h => getBestStreak(h.history || []));
  const maxStreak = allBest.length > 0 ? Math.max(...allBest) : 0;
  bestStreakEl.textContent = maxStreak;

  const completedToday = habits.filter(h => h.history && h.history.includes(todayKey)).length;
  totalCompletedEl.textContent = completedToday;

  totalHabitsEl.textContent = habits.length;

  const overallStreak = getOverallStreak();
  streakDaysEl.textContent = overallStreak;
}

function updateAchievements() {
  if (!achievementsList) return;

  const todayKey = getTodayKey();
  const completedToday = habits.filter(h => h.history && h.history.includes(todayKey)).length;
  const totalCompleted = habits.filter(h => h.history && h.history.length > 0).length;
  const allBest = habits.map(h => getBestStreak(h.history || []));
  const maxStreak = allBest.length > 0 ? Math.max(...allBest) : 0;
  const overallStreak = getOverallStreak();
  const allDoneToday = habits.length > 0 && habits.every(h => h.history && h.history.includes(todayKey));

  const achievements = achievementsList.querySelectorAll('.achievement-item');
  if (achievements.length >= 1) {
    const firstSteps = achievements[0];
    if (completedToday > 0 || totalCompleted > 0) {
      firstSteps.className = 'achievement-item unlocked';
    } else {
      firstSteps.className = 'achievement-item locked';
    }
  }

  if (achievements.length >= 2) {
    const onFire = achievements[1];
    if (maxStreak >= 7) {
      onFire.className = 'achievement-item unlocked';
    } else {
      onFire.className = 'achievement-item locked';
    }
  }

  if (achievements.length >= 3) {
    const consistencyKing = achievements[2];
    if (overallStreak >= 7) {
      consistencyKing.className = 'achievement-item unlocked';
    } else {
      consistencyKing.className = 'achievement-item locked';
    }
  }
}

function triggerConfetti() {
  const container = document.getElementById('confetti-container');
  if (!container) return;

  const colors = ['#6366f1', '#14b8a6', '#f43f5e', '#f59e0b', '#a855f7', '#22c55e', '#3b82f6'];

  for (let i = 0; i < 30; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 8 + 4;
    const left = Math.random() * 100;
    const delay = Math.random() * 0.5;
    const duration = Math.random() * 1.5 + 1.5;
    const rotation = Math.random() * 360;

    piece.style.cssText = `
      left: ${left}%;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      animation-delay: ${delay}s;
      animation-duration: ${duration}s;
      transform: rotate(${rotation}deg);
    `;

    container.appendChild(piece);

    setTimeout(() => piece.remove(), (delay + duration) * 1000 + 100);
  }
}

function saveAndRefresh() {
  localStorage.setItem('habitflow_data', JSON.stringify(habits));
  renderHabits();
  updateProgress();
  renderWeeklyChart();
  updateStats();
  updateAchievements();
}

function setupEventListeners() {
  if (addHabitBtn) {
    addHabitBtn.addEventListener('click', () => {
      addHabitModal.classList.add('open');
      setTimeout(() => {
        const input = document.getElementById('habit-name');
        if (input) input.focus();
      }, 100);
    });
  }

  if (closeModal) {
    closeModal.addEventListener('click', () => {
      addHabitModal.classList.remove('open');
    });
  }

  if (addHabitModal) {
    addHabitModal.addEventListener('click', (e) => {
      if (e.target === addHabitModal) addHabitModal.classList.remove('open');
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && addHabitModal) addHabitModal.classList.remove('open');
  });

  if (habitForm) {
    habitForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('habit-name').value.trim();
      const category = document.getElementById('habit-category').value;
      const frequency = document.getElementById('habit-frequency')?.value || 'daily';

      const newHabit = {
        id: Date.now().toString(),
        name,
        category,
        frequency,
        streak: 0,
        lastCompletedDate: null,
        history: []
      };

      habits.push(newHabit);
      saveAndRefresh();
      habitForm.reset();
      addHabitModal.classList.remove('open');
    });
  }
}

init();
