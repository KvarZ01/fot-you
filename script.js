// Загрузка и сохранение данных
let appData = {
    water: { today: 0, history: [] },
    food: [],
    weight: [],
    workouts: [],
    habits: [],
    settings: { waterGoal: 2000, calorieGoal: 2000, proteinGoal: 150, targetWeight: 70 },
    streak: { lastDate: null, count: 0 }
};

function loadData() {
    const saved = localStorage.getItem('calzenData');
    if (saved) {
        appData = JSON.parse(saved);
    } else {
        // Пример данных для демо
        appData.habits = [
            { id: 1, text: "Выпить стакан воды утром", completed: false, date: new Date().toDateString() }
        ];
    }
    updateAllUI();
}

function saveData() {
    localStorage.setItem('calzenData', JSON.stringify(appData));
}

// Вода
function addWater(ml) {
    if (isNaN(ml) || ml <= 0) return;
    appData.water.today += ml;
    appData.water.history.unshift({ amount: ml, time: new Date().toLocaleTimeString() });
    saveData();
    updateWaterUI();
    updateDashboard();
}

function quickAddWater(ml) { addWater(ml); }

function updateWaterUI() {
    const goal = appData.settings.waterGoal;
    const today = appData.water.today;
    const percent = Math.min((today / goal) * 100, 100);
    document.getElementById('waterPercent').innerText = Math.floor(percent) + '%';
    document.getElementById('waterAmount').innerText = today;
    document.getElementById('waterTarget').innerText = goal;
    
    const historyDiv = document.getElementById('waterHistoryList');
    if (historyDiv) {
        historyDiv.innerHTML = '<h4>История воды сегодня</h4>' + 
            appData.water.history.slice(0, 10).map(h => 
                `<div class="water-history-item">+${h.amount} мл — ${h.time}</div>`
            ).join('');
    }
}

// Еда
function addFood() {
    const name = document.getElementById('foodName').value;
    const cal = parseInt(document.getElementById('foodCal').value);
    const prot = parseInt(document.getElementById('foodProt').value) || 0;
    const fat = parseInt(document.getElementById('foodFat').value) || 0;
    const carb = parseInt(document.getElementById('foodCarb').value) || 0;
    const mealType = document.getElementById('foodMealType').value;
    
    if (!name || isNaN(cal)) return alert('Заполните название и калории');
    
    appData.food.push({
        id: Date.now(),
        name, calories: cal, protein: prot, fats: fat, carbs: carb,
        mealType, time: new Date().toLocaleTimeString(), date: new Date().toDateString()
    });
    saveData();
    updateFoodUI();
    updateDashboard();
    
    document.getElementById('foodName').value = '';
    document.getElementById('foodCal').value = '';
    document.getElementById('foodProt').value = '';
    document.getElementById('foodFat').value = '';
    document.getElementById('foodCarb').value = '';
}

function deleteFood(id) {
    appData.food = appData.food.filter(f => f.id !== id);
    saveData();
    updateFoodUI();
    updateDashboard();
}

function updateFoodUI() {
    const today = new Date().toDateString();
    const todayFood = appData.food.filter(f => f.date === today);
    
    const totals = todayFood.reduce((acc, f) => {
        acc.calories += f.calories;
        acc.protein += f.protein || 0;
        acc.fats += f.fats || 0;
        acc.carbs += f.carbs || 0;
        return acc;
    }, { calories: 0, protein: 0, fats: 0, carbs: 0 });
    
    document.getElementById('foodCalories').innerText = totals.calories;
    document.getElementById('foodProtein').innerText = totals.protein;
    document.getElementById('foodFats').innerText = totals.fats;
    document.getElementById('foodCarbs').innerText = totals.carbs;
    document.getElementById('foodCalGoal').innerText = appData.settings.calorieGoal;
    
    const foodList = document.getElementById('foodList');
    if (foodList) {
        foodList.innerHTML = todayFood.map(f => `
            <div class="food-item">
                <div><strong>${f.name}</strong><br><small>${f.time} • ${f.mealType}</small><br>🔥${f.calories}ккал 🥩${f.protein}г 🧈${f.fats}г 🍚${f.carbs}г</div>
                <button class="delete-btn" onclick="deleteFood(${f.id})">✖</button>
            </div>
        `).join('');
        if (todayFood.length === 0) foodList.innerHTML = '<p>Нет записей за сегодня</p>';
    }
}

// Вес
function addWeight() {
    const weight = parseFloat(document.getElementById('weightValue').value);
    if (isNaN(weight)) return alert('Введите вес');
    appData.weight.push({ value: weight, date: new Date().toLocaleDateString(), timestamp: Date.now() });
    appData.weight.sort((a,b) => a.timestamp - b.timestamp);
    saveData();
    updateWeightUI();
    updateDashboard();
    document.getElementById('weightValue').value = '';
}

function updateWeightUI() {
    const lastWeight = appData.weight[appData.weight.length - 1];
    const currentWeightSpan = document.getElementById('currentWeight');
    if (currentWeightSpan && lastWeight) currentWeightSpan.innerText = lastWeight.value;
    
    const historyDiv = document.getElementById('weightHistoryList');
    if (historyDiv) {
        historyDiv.innerHTML = '<h4>История веса</h4>' + 
            appData.weight.slice().reverse().slice(0, 10).map(w => 
                `<div class="weight-item">${w.date}: ${w.value} кг</div>`
            ).join('');
    }
    
    // График веса
    const ctx = document.getElementById('weightChart');
    if (ctx && appData.weight.length > 0) {
        if (window.weightChartInstance) window.weightChartInstance.destroy();
        window.weightChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: appData.weight.map(w => w.date),
                datasets: [{ label: 'Вес (кг)', data: appData.weight.map(w => w.value), borderColor: '#667eea', tension: 0.3 }]
            },
            options: { responsive: true, maintainAspectRatio: true }
        });
    }
}

// Тренировки
function addWorkout() {
    const name = document.getElementById('workoutName').value;
    const minutes = parseInt(document.getElementById('workoutMinutes').value);
    const burned = parseInt(document.getElementById('workoutCaloriesBurned').value) || 0;
    if (!name || isNaN(minutes)) return alert('Заполните название и длительность');
    
    appData.workouts.push({
        id: Date.now(),
        name, minutes, burned, date: new Date().toDateString(), time: new Date().toLocaleTimeString()
    });
    saveData();
    updateWorkoutUI();
    updateDashboard();
    
    document.getElementById('workoutName').value = '';
    document.getElementById('workoutMinutes').value = '';
    document.getElementById('workoutCaloriesBurned').value = '';
}

function deleteWorkout(id) {
    appData.workouts = appData.workouts.filter(w => w.id !== id);
    saveData();
    updateWorkoutUI();
    updateDashboard();
}

function updateWorkoutUI() {
    const today = new Date().toDateString();
    const todayWorkouts = appData.workouts.filter(w => w.date === today);
    const totals = todayWorkouts.reduce((acc, w) => {
        acc.minutes += w.minutes;
        acc.burned += w.burned || 0;
        return acc;
    }, { minutes: 0, burned: 0 });
    
    document.getElementById('totalWorkouts').innerText = todayWorkouts.length;
    document.getElementById('totalMinutes').innerText = totals.minutes;
    document.getElementById('totalBurned').innerText = totals.burned;
    
    const workoutList = document.getElementById('workoutList');
    if (workoutList) {
        workoutList.innerHTML = todayWorkouts.map(w => `
            <div class="workout-item">
                <div><strong>${w.name}</strong> — ${w.minutes} мин, 🔥${w.burned} ккал<br><small>${w.time}</small></div>
                <button class="delete-btn" onclick="deleteWorkout(${w.id})">✖</button>
            </div>
        `).join('');
        if (todayWorkouts.length === 0) workoutList.innerHTML = '<p>Нет тренировок за сегодня</p>';
    }
}

// Привычки
function addHabit() {
    const text = document.getElementById('newHabit').value;
    if (!text) return alert('Введите привычку');
    appData.habits.push({
        id: Date.now(),
        text: text,
        completed: false,
        date: new Date().toDateString()
    });
    saveData();
    updateHabitsUI();
    document.getElementById('newHabit').value = '';
}

function toggleHabit(id) {
    const habit = appData.habits.find(h => h.id === id);
    if (habit) {
        habit.completed = !habit.completed;
        saveData();
        updateHabitsUI();
        updateDashboard();
    }
}

function deleteHabit(id) {
    appData.habits = appData.habits.filter(h => h.id !== id);
    saveData();
    updateHabitsUI();
    updateDashboard();
}

function updateHabitsUI() {
    const habitsList = document.getElementById('habitsList');
    if (habitsList) {
        habitsList.innerHTML = appData.habits.map(h => `
            <div class="habit-item">
                <input type="checkbox" class="habit-checkbox" ${h.completed ? 'checked' : ''} onchange="toggleHabit(${h.id})">
                <span class="habit-text ${h.completed ? 'completed' : ''}">${h.text}</span>
                <button class="delete-btn" onclick="deleteHabit(${h.id})">✖</button>
            </div>
        `).join('');
    }
}

// Дашборд
function updateDashboard() {
    const today = new Date().toDateString();
    const todayFood = appData.food.filter(f => f.date === today);
    const foodTotals = todayFood.reduce((acc, f) => {
        acc.calories += f.calories;
        acc.protein += f.protein || 0;
        acc.fats += f.fats || 0;
        acc.carbs += f.carbs || 0;
        return acc;
    }, { calories: 0, protein: 0, fats: 0, carbs: 0 });
    
    document.getElementById('todayWater').innerText = appData.water.today;
    document.getElementById('todayCalories').innerText = foodTotals.calories;
    document.getElementById('todayProtein').innerText = foodTotals.protein;
    document.getElementById('todayFats').innerText = foodTotals.fats;
    document.getElementById('todayCarbs').innerText = foodTotals.carbs;
    document.getElementById('waterGoal').innerText = appData.settings.waterGoal;
    document.getElementById('calorieGoal').innerText = appData.settings.calorieGoal;
    
    const waterPercent = (appData.water.today / appData.settings.waterGoal) * 100;
    document.getElementById('waterProgressFill').style.width = Math.min(waterPercent, 100) + '%';
    
    // Серия (streak)
    const completedHabits = appData.habits.filter(h => h.completed).length;
    const hasActivity = appData.water.today > 0 || foodTotals.calories > 0 || completedHabits > 0;
    if (hasActivity) {
        const lastDate = appData.streak.lastDate;
        const todayStr = new Date().toDateString();
        if (lastDate === todayStr) { /* уже сегодня */ }
        else if (lastDate === new Date(Date.now() - 86400000).toDateString()) {
            appData.streak.count++;
        } else if (lastDate !== todayStr) {
            appData.streak.count = 1;
        }
        appData.streak.lastDate = todayStr;
        saveData();
    }
    document.getElementById('streakDays').innerText = appData.streak.count;
    
    // Тренд веса
    if (appData.weight.length >= 2) {
        const last = appData.weight[appData.weight.length-1].value;
        const prev = appData.weight[appData.weight.length-2].value;
        const trendSpan = document.getElementById('weightTrend');
        if (trendSpan) {
            if (last < prev) trendSpan.innerHTML = '📉 -' + (prev - last).toFixed(1) + ' кг за последнюю запись';
            else if (last > prev) trendSpan.innerHTML = '📈 +' + (last - prev).toFixed(1) + ' кг';
            else trendSpan.innerHTML = '➖ без изменений';
        }
    }
}

// Настройки
function saveSettings() {
    appData.settings.waterGoal = parseInt(document.getElementById('setWaterGoal').value) || 2000;
    appData.settings.calorieGoal = parseInt(document.getElementById('setCalorieGoal').value) || 2000;
    appData.settings.proteinGoal = parseInt(document.getElementById('setProteinGoal').value) || 150;
    appData.settings.targetWeight = parseFloat(document.getElementById('setTargetWeight').value) || 70;
    saveData();
    updateAllUI();
    alert('Цели сохранены');
}

function updateAllUI() {
    updateWaterUI();
    updateFoodUI();
    updateWeightUI();
    updateWorkoutUI();
    updateHabitsUI();
    updateDashboard();
    
    // Обновляем поля настроек
    document.getElementById('setWaterGoal').value = appData.settings.waterGoal;
    document.getElementById('setCalorieGoal').value = appData.settings.calorieGoal;
    document.getElementById('setProteinGoal').value = appData.settings.proteinGoal;
    document.getElementById('setTargetWeight').value = appData.settings.targetWeight;
}

// Экспорт/импорт
function exportData() {
    const dataStr = JSON.stringify(appData, null, 2);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'calzen_backup.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                appData = JSON.parse(ev.target.result);
                saveData();
                updateAllUI();
                alert('Данные импортированы');
            } catch(err) { alert('Ошибка импорта'); }
        };
        reader.readAsText(file);
    };
    input.click();
}

// Навигация по вкладкам
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(tabId).classList.add('active');
    });
});

// Инициализация
loadData();
