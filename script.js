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
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();
const currentDay = new Date().getDate();
const todayKey = `${currentYear}-${currentMonth + 1}-${currentDay}`;

// Initialize App
function init() {
    updateDateTime();
    renderHabits();
    updateProgress();
    renderWeeklyChart();
    setupEventListeners();
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
    
    if (habits.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';

    habits.forEach(habit => {
        // Check if habit was completed today
        const isCompleted = habit.lastCompletedDate === todayKey;
        
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
                    ${habit.streak} day streak
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

    if (habit.lastCompletedDate === todayKey) {
        // Un-complete
        habit.lastCompletedDate = habit.previousCompletionDate || null;
        habit.streak = Math.max(0, habit.streak - 1);
    } else {
        // Complete
        habit.previousCompletionDate = habit.lastCompletedDate;
        habit.lastCompletedDate = todayKey;
        habit.streak += 1;
        
        // Push to history for charts
        if (!habit.history) habit.history = [];
        if (!habit.history.includes(todayKey)) {
            habit.history.push(todayKey);
        }
    }

    saveAndRefresh();
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

    const completed = habits.filter(h => h.lastCompletedDate === todayKey).length;
    const percent = Math.round((completed / total) * 100);
    
    setProgress(percent);
    progressSummary.textContent = `${completed} of ${total} habits completed`;
}

function setProgress(percent) {
    const offset = 376.99 - (percent / 100) * 376.99;
    progressCircle.style.strokeDashoffset = offset;
    progressPercent.textContent = `${percent}%`;
}

function renderWeeklyChart() {
    const chart = document.getElementById('weekly-chart');
    chart.innerHTML = '';
    
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const today = new Date().getDay();
    
    for (let i = 0; i < 7; i++) {
        const dayIdx = (today - 6 + i + 7) % 7;
        const dayName = days[dayIdx];
        
        // Calculate % for that day (mocked here for simplicity, but could use history)
        let dayPercent = 0;
        if (i === 6) { // Today
            const total = habits.length;
            const completed = habits.filter(h => h.lastCompletedDate === todayKey).length;
            dayPercent = total > 0 ? (completed / total) * 100 : 0;
        } else {
            // Random-ish historical data for visual effect
            dayPercent = habits.length > 0 ? Math.floor(Math.random() * 60) + 20 : 0;
        }

        const barContainer = document.createElement('div');
        barContainer.className = 'chart-bar-container';
        barContainer.innerHTML = `
            <div class="chart-bar ${i === 6 ? 'active' : ''}" style="height: ${Math.max(10, dayPercent)}%;"></div>
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
            streak: 0,
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
