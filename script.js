// HabitFlow Application Logic

// State Management
let habits = JSON.parse(localStorage.getItem('habitflow_data')) || [];

// Constants
const progressCircle = document.getElementById('progress-circle');
const progressPercent = document.getElementById('progress-percent');
const progressSummary = document.getElementById('progress-summary');
const habitsList = document.getElementById('habits-list');
const emptyState = document.getElementById('empty-state');
const addHabitBtn = document.getElementById('add-habit-btn');
const addHabitModal = document.getElementById('add-habit-modal');
const closeModal = document.getElementById('close-modal');
const habitForm = document.getElementById('habit-form');
function getTodayKey(d) {
    const date = d || new Date();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${mm}-${dd}`;
}

// Initialize App
function init() {
    migrateOldData();
    updateDateTime();
    renderHabits();
    updateProgress();
    renderWeeklyChart();
    setupEventListeners();
}

function migrateOldData() {
    const key = 'habitflow_data';
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const data = JSON.parse(raw);
    let changed = false;
    data.forEach(h => {
        if (!h.history) return;
        h.history = h.history.map(d => {
            const parts = d.split('-');
            if (parts.length === 3 && parts[1].length === 1) {
                changed = true;
                const mm = String(Number(parts[1])).padStart(2, '0');
                const dd = String(Number(parts[2])).padStart(2, '0');
                return `${parts[0]}-${mm}-${dd}`;
            }
            return d;
        });
        if (h.lastCompletedDate && h.lastCompletedDate.split('-')[1].length === 1) {
            changed = true;
            const p = h.lastCompletedDate.split('-');
            h.lastCompletedDate = `${p[0]}-${String(Number(p[1])).padStart(2, '0')}-${String(Number(p[2])).padStart(2, '0')}`;
        }
    });
    if (changed) localStorage.setItem(key, JSON.stringify(data));
}

function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', options);

    const hour = now.getHours();
    const greeting = document.getElementById('greeting');
    if (hour < 12) greeting.textContent = "Good morning! ☀️";
    else if (hour < 18) greeting.textContent = "Good afternoon! 🌤️";
    else greeting.textContent = "Good evening! 🌙";
}

function renderHabits() {
    habitsList.innerHTML = '';
    const habitCount = document.getElementById('habit-count');
    habitCount.textContent = `${habits.length} ritual${habits.length !== 1 ? 's' : ''}`;
    
    if (habits.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';

    habits.forEach(habit => {
        const todayKey = getTodayKey();
        const isCompleted = habit.lastCompletedDate === todayKey;
        const streak = calcStreak(habit);
        
        const habitEl = document.createElement('div');
        habitEl.className = 'habit-item';
        habitEl.innerHTML = `
            <div class="habit-info">
                <div class="habit-check ${isCompleted ? 'completed' : ''}" onclick="toggleHabit('${habit.id}')">
                    ${isCompleted ? '<i data-lucide="check" style="width: 18px; height: 18px;"></i>' : ''}
                </div>
                <div>
                    <h3 style="font-size: 1rem; margin-bottom: 2px; ${isCompleted ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${habit.name}</h3>
                    <p style="font-size: 0.75rem; color: var(--text-muted);">${habit.category}</p>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 16px;">
                <div class="streak-badge">
                    <i data-lucide="flame" style="width: 14px; height: 14px;"></i>
                    ${streak} day streak
                </div>
                <button onclick="deleteHabit('${habit.id}')" style="background: none; color: #ef4444; opacity: 0.5;"><i data-lucide="trash-2" style="width: 18px; height: 18px;"></i></button>
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
    if (habit.lastCompletedDate === todayKey) {
        habit.lastCompletedDate = habit.previousCompletionDate || null;
    } else {
        habit.previousCompletionDate = habit.lastCompletedDate;
        habit.lastCompletedDate = todayKey;
        if (!habit.history) habit.history = [];
        if (!habit.history.includes(todayKey)) {
            habit.history.push(todayKey);
        }
    }

    saveAndRefresh();
}

function calcStreak(habit) {
    const sorted = (habit.history || []).map(d => new Date(d)).filter(d => !isNaN(d)).sort((a, b) => b - a);
    if (sorted.length === 0) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let checkDate = new Date(today);
    const hasToday = sorted.some(d => d.getTime() === today.getTime());
    const hasYesterday = sorted.some(d => d.getTime() === today.getTime() - 86400000);
    if (!hasToday && !hasYesterday) return 0;
    if (!hasToday && hasYesterday) checkDate.setDate(checkDate.getDate() - 1);
    let streak = 0;
    while (sorted.some(d => d.getTime() === checkDate.getTime())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
}

function deleteHabit(id) {
    if (confirm('Delete this habit?')) {
        habits = habits.filter(h => h.id !== id);
        saveAndRefresh();
    }
}

function updateProgress() {
    const total = habits.length;
    if (total === 0) {
        setProgress(0);
        progressSummary.textContent = "0 of 0 habits completed";
        return;
    }

    const completed = habits.filter(h => h.lastCompletedDate === getTodayKey()).length;
    const percent = Math.round((completed / total) * 100);
    
    setProgress(percent);
    progressSummary.textContent = `${completed} of ${total} habits completed`;
}

function setProgress(percent) {
    const circumference = 534.07; // 2 * PI * 85
    const offset = circumference - (percent / 100) * circumference;
    progressCircle.style.strokeDashoffset = offset;
    progressPercent.textContent = `${percent}%`;
}

function renderWeeklyChart() {
    const chart = document.getElementById('weekly-chart');
    chart.innerHTML = '';
    
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dayKey = getTodayKey(d);
        const dayName = days[d.getDay()];
        
        const total = habits.length;
        const completed = habits.filter(h => (h.history || []).includes(dayKey)).length;
        const dayPercent = total > 0 ? (completed / total) * 100 : 0;

        const barContainer = document.createElement('div');
        barContainer.className = 'chart-bar-container';
        barContainer.innerHTML = `
            <div class="chart-bar ${i === 0 ? 'active' : ''}" style="height: ${Math.max(8, dayPercent)}%;"></div>
            <span class="chart-label">${dayName}</span>
        `;
        chart.appendChild(barContainer);
    }
}

function saveAndRefresh() {
    localStorage.setItem('habitflow_data', JSON.stringify(habits));
    renderHabits();
    updateProgress();
    renderWeeklyChart();
}

function setupEventListeners() {
    addHabitBtn.addEventListener('click', () => {
        addHabitModal.style.display = 'flex';
    });

    closeModal.addEventListener('click', () => {
        addHabitModal.style.display = 'none';
    });

    habitForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('habit-name').value;
        const category = document.getElementById('habit-category').value;
        
        const newHabit = {
            id: Date.now().toString(),
            name,
            category,
            lastCompletedDate: null,
            history: []
        };
        
        habits.push(newHabit);
        saveAndRefresh();
        
        habitForm.reset();
        addHabitModal.style.display = 'none';
    });

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === addHabitModal) addHabitModal.style.display = 'none';
    });
}

// Start
init();
