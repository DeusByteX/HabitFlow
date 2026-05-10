// HabitFlow App Logic

// State
let habits = JSON.parse(localStorage.getItem('habits')) || [];
const habitList = document.getElementById('habitList');
const habitForm = document.getElementById('habitForm');
const modalOverlay = document.getElementById('modalOverlay');
const addHabitBtn = document.getElementById('addHabitBtn');
const closeModal = document.getElementById('closeModal');
const greeting = document.getElementById('greeting');

// Initialize
function init() {
    setGreeting();
    renderHabits();
    updateProgress();
    renderChart();
}

// Greeting
function setGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) greeting.textContent = 'Good morning! ☀️';
    else if (hour < 18) greeting.textContent = 'Good afternoon! 🌤️';
    else greeting.textContent = 'Good evening! 🌙';
}

// Render Habits
function renderHabits() {
    habitList.innerHTML = '';
    const today = new Date().toISOString().split('T')[0];

    if (habits.length === 0) {
        habitList.innerHTML = `
            <div style="text-align: center; padding: 4rem; background: white; border-radius: 24px; border: 2px dashed #e2e8f0;">
                <p style="color: var(--text-muted); margin-bottom: 1.5rem;">No habits added yet. Start by adding your first habit!</p>
                <button class="btn btn-primary" onclick="document.getElementById('modalOverlay').style.display = 'flex'">
                    <i data-lucide="plus"></i> Add Your First Habit
                </button>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    habits.forEach(habit => {
        const isCompletedToday = habit.completedDates.includes(today);
        const streak = calculateStreak(habit);
        
        const habitEl = document.createElement('div');
        habitEl.className = 'habit-card';
        habitEl.innerHTML = `
            <div class="habit-info">
                <div class="habit-checkbox ${isCompletedToday ? 'checked' : ''}" onclick="toggleHabit('${habit.id}')">
                    ${isCompletedToday ? '<i data-lucide="check" style="width: 18px; height: 18px;"></i>' : ''}
                </div>
                <div>
                    <span class="habit-name" style="${isCompletedToday ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">${habit.name}</span>
                    <div style="display: flex; gap: 0.5rem; margin-top: 0.2rem;">
                        <span class="habit-streak">🔥 ${streak} day streak</span>
                    </div>
                </div>
            </div>
            <button onclick="deleteHabit('${habit.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; opacity: 0.5; transition: 0.2s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.5">
                <i data-lucide="trash-2" style="width: 20px; height: 20px;"></i>
            </button>
        `;
        habitList.appendChild(habitEl);
    });
    lucide.createIcons();
}

// Toggle Habit Completion
function toggleHabit(id) {
    const today = new Date().toISOString().split('T')[0];
    const habit = habits.find(h => h.id === id);
    
    const index = habit.completedDates.indexOf(today);
    if (index === -1) {
        habit.completedDates.push(today);
    } else {
        habit.completedDates.splice(index, 1);
    }
    
    saveAndRefresh();
}

// Calculate Streak
function calculateStreak(habit) {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let checkDate = new Date(today);
    
    // Check if completed today or yesterday to continue streak
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (!habit.completedDates.includes(todayStr) && !habit.completedDates.includes(yesterdayStr)) {
        return 0;
    }

    // If not completed today but was completed yesterday, start counting from yesterday
    if (!habit.completedDates.includes(todayStr) && habit.completedDates.includes(yesterdayStr)) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (habit.completedDates.includes(dateStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    
    return streak;
}

// Add Habit
habitForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('habitName').value;
    
    const newHabit = {
        id: Date.now().toString(),
        name: name,
        completedDates: [],
        createdAt: new Date().toISOString()
    };
    
    habits.push(newHabit);
    document.getElementById('habitName').value = '';
    modalOverlay.style.display = 'none';
    saveAndRefresh();
});

// Delete Habit
function deleteHabit(id) {
    if (confirm('Are you sure you want to delete this habit?')) {
        habits = habits.filter(h => h.id !== id);
        saveAndRefresh();
    }
}

// Save and Refresh
function saveAndRefresh() {
    localStorage.setItem('habits', JSON.stringify(habits));
    renderHabits();
    updateProgress();
    renderChart();
}

// Update Progress Circle
function updateProgress() {
    const today = new Date().toISOString().split('T')[0];
    const total = habits.length;
    const completed = habits.filter(h => h.completedDates.includes(today)).length;
    
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    const circle = document.getElementById('progressCircle');
    const text = document.getElementById('progressText');
    const subtext = document.getElementById('progressSubtext');
    
    if (circle) {
        const circumference = 2 * Math.PI * 70;
        const offset = circumference - (percentage / 100) * circumference;
        circle.style.strokeDashoffset = offset;
        text.textContent = `${percentage}%`;
        subtext.textContent = `${completed} of ${total} habits completed`;
    }
}

// Render Weekly Chart
function renderChart() {
    const chart = document.getElementById('weeklyChart');
    if (!chart) return;
    chart.innerHTML = '';
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dayLabel = days[d.getDay()];
        const dateStr = d.toISOString().split('T')[0];
        
        const totalHabitsOnDay = habits.filter(h => {
            const createdDate = h.createdAt.split('T')[0];
            return createdDate <= dateStr;
        }).length;
        
        const completedOnDay = habits.filter(h => h.completedDates.includes(dateStr)).length;
        const percent = totalHabitsOnDay === 0 ? 0 : (completedOnDay / totalHabitsOnDay) * 100;
        
        const barWrapper = document.createElement('div');
        barWrapper.className = 'chart-bar-wrapper';
        barWrapper.innerHTML = `
            <div class="chart-bar" style="height: 100%;">
                <div class="chart-bar-fill" style="height: ${percent}%"></div>
            </div>
            <span class="chart-day">${dayLabel}</span>
        `;
        chart.appendChild(barWrapper);
    }
}

// Modal Controls
addHabitBtn.onclick = () => modalOverlay.style.display = 'flex';
closeModal.onclick = () => modalOverlay.style.display = 'none';
window.onclick = (e) => {
    if (e.target === modalOverlay) modalOverlay.style.display = 'none';
};

// Start App
init();
