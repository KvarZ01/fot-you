// ========== КОНФИГУРАЦИЯ FIREBASE ==========
const firebaseConfig = {
    apiKey: "AIzaSyD3nF7kLmP9xR2vB5hJ8qW1eC4tY6uI0oP",
    authDomain: "calzen-app.firebaseapp.com",
    projectId: "calzen-app",
    storageBucket: "calzen-app.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abc123def456"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// ========== ГЛОБАЛЬНЫЕ ДАННЫЕ ==========
let appData = {
    water: { today: 0, history: [] },
    food: [],
    weight: [],
    workouts: [],
    habits: [],
    userProfile: {
        name: "Гость",
        weight: 70,
        height: 170,
        age: 30,
        gender: "male",
        activity: 1.55,
        goal: "maintain"
    },
    settings: {
        waterGoal: 2000,
        calorieGoal: 2000,
        proteinGoal: 150,
        fatsGoal: 65,
        carbsGoal: 250
    },
    streak: { lastDate: null, count: 0 },
    userId: "local"
};

let currentUser = null;

// ========== ЗАГРУЗКА/СОХРАНЕНИЕ ==========
function loadData() {
    const userId = currentUser ? currentUser.uid : "local";
    const saved = localStorage.getItem(`calzenData_${userId}`);
    if (saved) {
        appData = JSON.parse(saved);
    } else {
        // Рассчитываем нормы по умолчанию
        recalculateCaloriesFromProfile();
    }
    updateAllUI();
}

function saveData() {
    const userId = currentUser ? currentUser.uid : "local";
    localStorage.setItem(`calzenData_${userId}`, JSON.stringify(appData));
}

// ========== АВТОМАТИЧЕСКИЙ РАСЧЁТ КАЛОРИЙ (Harris-Benedict) ==========
function calculateBMR() {
    const { weight, height, age, gender } = appData.userProfile;
    if (!weight || !height || !age) return 2000;
    if (gender === "male") {
        return 88.36 + (13.4 * weight) + (4.8 * height) - (5.7 * age);
    } else {
        return 447.6 + (9.2 * weight) + (3.1 * height) - (4.3 * age);
    }
}

function recalculateCaloriesFromProfile() {
    const bmr = calculateBMR();
    const activity = parseFloat(appData.userProfile.activity);
    let tdee = bmr * activity;
    
    // Корректировка под цель
    if (appData.userProfile.goal === "lose") {
        tdee -= 500; // похудение
    } else if (appData.userProfile.goal === "gain") {
        tdee += 300; // набор массы
    }
    
    tdee = Math.max(1200, Math.round(tdee));
    
    // Расчёт БЖУ (белки 30%, жиры 25%, углеводы 45%)
    const proteinGoal = Math.round((tdee * 0.3) / 4);
    const fatsGoal = Math.round((tdee * 0.25) / 9);
    const carbsGoal = Math.round((tdee * 0.45) / 4);
    
    appData.settings.calorieGoal = tdee;
    appData.settings.proteinGoal = proteinGoal;
    appData.settings.fatsGoal = fatsGoal;
    appData.settings.carbsGoal = carbsGoal;
    
    // Вода: 30-40 мл на кг веса
    if (appData.userProfile.weight) {
        appData.settings.waterGoal = Math.round(appData.userProfile.weight * 33);
    }
    
    saveData();
}

// ========== СОХРАНЕНИЕ ВСЕХ НАСТРОЕК (автоматически) ==========
function saveAllSettings() {
    // Сохраняем профиль
    appData.userProfile.name = document.getElementById('userFullName')?.value || "Гость";
    appData.userProfile.weight = parseFloat(document.getElementById('userWeight')?.value) || 70;
    appData.userProfile.height = parseInt(document.getElementById('userHeight')?.value) || 170;
    appData.userProfile.age = parseInt(document.getElementById('userAge')?.value) || 30;
    appData.userProfile.gender = document.getElementById('userGender')?.value || "male";
    appData.userProfile.activity = document.getElementById('userActivity')?.value || "1.55";
    appData.userProfile.goal = document.getElementById('userGoal')?.value || "maintain";
    
    // Ручные настройки (если пользователь ввел вручную)
    const manualCal = document.getElementById('setCalorieGoalModal')?.value;
    const manualProtein = document.getElementById('setProteinGoalModal')?.value;
    const manualFats = document.getElementById('setFatsGoalModal')?.value;
    const manualCarbs = document.getElementById('setCarbsGoalModal')?.value;
    const manualWater = document.getElementById('setWaterGoalModal')?.value;
    
    if (manualCal && parseInt(manualCal) > 0) {
        appData.settings.calorieGoal = parseInt(manualCal);
    } else {
        // Авторасчёт
        recalculateCaloriesFromProfile();
    }
    
    if (manualProtein && parseInt(manualProtein) > 0) appData.settings.proteinGoal = parseInt(manualProtein);
    if (manualFats && parseInt(manualFats) > 0) appData.settings.fatsGoal = parseInt(manualFats);
    if (manualCarbs && parseInt(manualCarbs) > 0) appData.settings.carbsGoal = parseInt(manualCarbs);
    if (manualWater && parseInt(manualWater) > 0) appData.settings.waterGoal = parseInt(manualWater);
    
    saveData();
    updateAllUI();
    closeSettingsModal();
}

// Заполнение модального окна текущими значениями
function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        document.getElementById('userFullName').value = appData.userProfile.name || "";
        document.getElementById('userWeight').value = appData.userProfile.weight;
        document.getElementById('userHeight').value = appData.userProfile.height;
        document.getElementById('userAge').value = appData.userProfile.age;
        document.getElementById('userGender').value = appData.userProfile.gender;
        document.getElementById('userActivity').value = appData.userProfile.activity;
        document.getElementById('userGoal').value = appData.userProfile.goal;
        document.getElementById('setCalorieGoalModal').value = appData.settings.calorieGoal;
        document.getElementById('setProteinGoalModal').value = appData.settings.proteinGoal;
        document.getElementById('setFatsGoalModal').value = appData.settings.fatsGoal;
        document.getElementById('setCarbsGoalModal').value = appData.settings.carbsGoal;
        document.getElementById('setWaterGoalModal').value = appData.settings.waterGoal;
        modal.style.display = 'flex';
    }
}

function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.style.display = 'none';
}

// ========== ПРОФИЛЬ И АВТОРИЗАЦИЯ ==========
function openProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) modal.style.display = 'flex';
    updateAuthUI();
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) modal.style.display = 'none';
}

function updateAuthUI() {
    const unauthed = document.getElementById('unauthedView');
    const authed = document.getElementById('authedView');
    const avatarSpan = document.getElementById('avatarInitials');
    const userNameSpan = document.getElementById('userNameDisplay');
    const profileAvatar = document.getElementById('profileAvatar');
    const userEmailSpan = document.getElementById('userEmail');
    
    if (currentUser) {
        if (unauthed) unauthed.style.display = 'none';
        if (authed) authed.style.display = 'block';
        const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || "Пользователь";
        if (userNameSpan) userNameSpan.innerText = displayName;
        if (avatarSpan) avatarSpan.innerText = displayName.charAt(0).toUpperCase();
        if (profileAvatar) profileAvatar.innerText = displayName.charAt(0).toUpperCase();
        if (userEmailSpan) userEmailSpan.innerText = currentUser.email || "email не указан";
        
        // Загружаем данные пользователя при смене аккаунта
        loadData();
    } else {
        if (unauthed) unauthed.style.display = 'block';
        if (authed) authed.style.display = 'none';
        if (userNameSpan) userNameSpan.innerText = "Гость";
        if (avatarSpan) avatarSpan.innerText = "👤";
    }
}

function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then(result => {
        currentUser = result.user;
        updateAuthUI();
        closeProfileModal();
        loadData();
    }).catch(error => {
        console.error("Google auth error:", error);
        alert("Ошибка входа через Google");
    });
}

function signInWithApple() {
    const provider = new firebase.auth.OAuthProvider('apple.com');
    auth.signInWithPopup(provider).then(result => {
        currentUser = result.user;
        updateAuthUI();
        closeProfileModal();
        loadData();
    }).catch(error => {
        console.error("Apple auth error:", error);
        alert("Ошибка входа через Apple");
    });
}

function signOut() {
    auth.signOut().then(() => {
        currentUser = null;
        updateAuthUI();
        loadData();
    });
}

// Следим за состоянием авторизации
auth.onAuthStateChanged(user => {
    currentUser = user;
    updateAuthUI();
    loadData();
});

// ========== ИИ АНАЛИЗ ЕДЫ (Gemini) ==========
async function analyzeFoodWithAI() {
    const fileInput = document.getElementById('aiPhotoInput');
    const file = fileInput?.files[0];
    if (!file) {
        alert("Выберите фото еды");
        return;
    }
    
    const resultDiv = document.getElementById('aiResult');
    resultDiv.classList.remove('hidden');
    resultDiv.innerHTML = "🔄 ИИ анализирует блюдо...";
    
    // Конвертируем в base64
    const reader = new FileReader();
    reader.onloadend = async function() {
        const base64 = reader.result.split(',')[1];
        
        // Используем бесплатный API Gemini (ключ встроен)
        const apiKey = "AIzaSyD3nF7kLmP9xR2vB5hJ8qW1eC4tY6uI0oP";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const prompt = `Ты эксперт по питанию. Проанализируй еду на фото. Ответь ТОЛЬКО в формате JSON: {"name":"название","calories":число,"protein":число,"fats":число,"carbs":число}. Если не видно - поставь "Не определено" и 0.`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            { inline_data: { mime_type: "image/jpeg", data: base64 } }
                        ]
                    }]
                })
            });
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
            const cleanText = text.replace(/```json|```/g, '').trim();
            const result = JSON.parse(cleanText);
            
            resultDiv.innerHTML = `
                <strong>🤖 ИИ определил:</strong><br>
                🍲 ${result.name || "Блюдо"}<br>
                🔥 ${result.calories || 0} ккал | 🥩 ${result.protein || 0}г | 🧈 ${result.fats || 0}г | 🍚 ${result.carbs || 0}г
                <button onclick="quickAddFromAI('${result.name || "Блюдо"}', ${result.calories || 0}, ${result.protein || 0}, ${result.fats || 0}, ${result.carbs || 0})" style="margin-top:10px; background:#0a84ff; border:none; padding:8px 16px; border-radius:12px; color:white;">✅ Добавить в дневник</button>
            `;
        } catch(e) {
            resultDiv.innerHTML = "❌ Ошибка анализа. Попробуйте другое фото.";
        }
    };
    reader.readAsDataURL(file);
}

function quickAddFromAI(name, cal, prot, fat, carb) {
    // Переключаемся на вкладку еды
    document.querySelector('.tab-item[data-tab="food"]').click();
    // Заполняем форму
    document.getElementById('foodName').value = name;
    document.getElementById('foodCal').value = cal;
    document.getElementById('foodProt').value = prot;
    document.getElementById('foodFat').value = fat;
    document.getElementById('foodCarb').value = carb;
    addFood();
}

// ========== ВСЕ ОСТАЛЬНЫЕ ФУНКЦИИ (вода, еда, вес, тренировки, привычки) ==========
function addWater(ml) {
    if (isNaN(ml) || ml <= 0) return;
    appData.water.today += ml;
    appData.water.history.unshift({ amount: ml, time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) });
    saveData();
    updateAllUI();
}

function addFood() {
    const name = document.getElementById('foodName')?.value;
    const cal = parseInt(document.getElementById('foodCal')?.value);
    const prot = parseInt(document.getElementById('foodProt')?.value) || 0;
    const fat = parseInt(document.getElementById('foodFat')?.value) || 0;
    const carb = parseInt(document.getElementById('foodCarb')?.value) || 0;
    const mealType = document.getElementById('foodMealType')?.value;
    
    if (!name || isNaN(cal)) return alert('Заполните название и калории');
    
    appData.food.push({
        id: Date.now(),
        name, calories: cal, protein: prot, fats: fat, carbs: carb,
        mealType, time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}), date: new Date().toDateString()
    });
    saveData();
    updateAllUI();
    
    const inputs = ['foodName', 'foodCal', 'foodProt', 'foodFat', 'foodCarb'];
    inputs.forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
}

function deleteFood(id) {
    appData.food = appData.food.filter(f => f.id !== id);
    saveData();
    updateAllUI();
}

function addWeight() {
    const weight = parseFloat(document.getElementById('weightValue')?.value);
    if (isNaN(weight)) return alert('Введите вес');
    appData.weight.push({ value: weight, date: new Date().toLocaleDateString('ru-RU'), timestamp: Date.now() });
    appData.weight.sort((a,b) => a.timestamp - b.timestamp);
    saveData();
    updateAllUI();
    if (document.getElementById('weightValue')) document.getElementById('weightValue').value = '';
}

function addWorkout() {
    const name = document.getElementById('workoutName')?.value;
    const minutes = parseInt(document.getElementById('workoutMinutes')?.value);
    const burned = parseInt(document.getElementById('workoutCaloriesBurned')?.value) || 0;
    if (!name || isNaN(minutes)) return alert('Заполните название и длительность');
    
    appData.workouts.push({
        id: Date.now(),
        name, minutes, burned, date: new Date().toDateString(), time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
    });
    saveData();
    updateAllUI();
    
    const inputs = ['workoutName', 'workoutMinutes', 'workoutCaloriesBurned'];
    inputs.forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
}

function deleteWorkout(id) {
    appData.workouts = appData.workouts.filter(w => w.id !== id);
    saveData();
    updateAllUI();
}

function addHabit() {
    const text = document.getElementById('newHabit')?.value;
    if (!text) return alert('Введите привычку');
    appData.habits.push({ id: Date.now(), text: text, completed: false });
    saveData();
    updateAllUI();
    if (document.getElementById('newHabit')) document.getElementById('newHabit').value = '';
}

function toggleHabit(id) {
    const habit = appData.habits.find(h => h.id === id);
    if (habit) {
        habit.completed = !habit.completed;
        saveData();
        updateAllUI();
    }
}

function deleteHabit(id) {
    appData.habits = appData.habits.filter(h => h.id !== id);
    saveData();
    updateAllUI();
}

// ========== ОБНОВЛЕНИЕ ВСЕГО UI ==========
function updateWaterUI() {
    const goal = appData.settings.waterGoal;
    const today = appData.water.today;
    const percent = Math.min((today / goal) * 100, 100);
    
    const percentElem = document.getElementById('waterPercent');
    if (percentElem) percentElem.innerText = Math.floor(percent) + '%';
    
    const todaySpan = document.getElementById('todayWater');
    if (todaySpan) todaySpan.innerText = today;
    
    const waterGoalSpan = document.getElementById('waterGoal');
    if (waterGoalSpan) waterGoalSpan.innerText = goal;
    
    const waterAmountDetail = document.getElementById('waterAmountDetail');
    if (waterAmountDetail) waterAmountDetail.innerText = today;
    
    const waterTargetDetail = document.getElementById('waterTargetDetail');
    if (waterTargetDetail) waterTargetDetail.innerText = goal;
    
    const fillDetail = document.getElementById('waterProgressFillDetail');
    if (fillDetail) fillDetail.style.width = percent + '%';
    
    const ring = document.getElementById('waterRingProgress');
    if (ring) {
        const circumference = 502.4;
        const offset = circumference - (percent / 100) * circumference;
        ring.style.strokeDashoffset = offset;
    }
    
    const historyDiv = document.getElementById('waterHistoryList');
    if (historyDiv) {
        historyDiv.innerHTML = appData.water.history.slice(0, 10).map(h => `<div class="water-history-item">+${h.amount} мл — ${h.time}</div>`).join('');
        if (appData.water.history.length === 0) historyDiv.innerHTML = '<div style="color:#8e8e93; text-align:center;">Нет записей</div>';
    }
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
    document.getElementById('todayCalories').innerText = totals.calories;
    document.getElementById('todayProtein').innerText = totals.protein;
    document.getElementById('todayFats').innerText = totals.fats;
    document.getElementById('todayCarbs').innerText = totals.carbs;
    
    const foodList = document.getElementById('foodList');
    if (foodList) {
        foodList.innerHTML = todayFood.map(f => `
            <div class="food-item">
                <div><strong>${f.name}</strong><br><small>${f.time}</small><br>🔥${f.calories}ккал 🥩${f.protein}г 🧈${f.fats}г 🍚${f.carbs}г</div>
                <button class="delete-btn" onclick="deleteFood(${f.id})">✖</button>
            </div>
        `).join('');
        if (todayFood.length === 0) foodList.innerHTML = '<div style="color:#8e8e93; text-align:center;">Нет записей</div>';
    }
    
    const recentDiv = document.getElementById('recentMealsList');
    if (recentDiv) {
        recentDiv.innerHTML = todayFood.slice(0, 3).map(f => `<div class="meal-item-mini" style="background:#1c1c1e; border-radius:14px; padding:12px; margin-bottom:8px; display:flex; justify-content:space-between;"><span>${f.name}</span><span style="color:#ff9f0a;">${f.calories} ккал</span></div>`).join('');
        if (todayFood.length === 0) recentDiv.innerHTML = '<div style="color:#8e8e93; text-align:center;">Добавьте первый приём пищи</div>';
    }
}

function updateWeightUI() {
    const lastWeight = appData.weight[appData.weight.length - 1];
    const currentDisplay = document.getElementById('currentWeightDisplay');
    if (currentDisplay && lastWeight) currentDisplay.innerText = lastWeight.value;
    else if (currentDisplay) currentDisplay.innerText = '—';
    
    const historyDiv = document.getElementById('weightHistoryList');
    if (historyDiv) {
        historyDiv.innerHTML = appData.weight.slice().reverse().slice(0, 10).map(w => `<div class="weight-item">${w.date}: ${w.value} кг</div>`).join('');
    }
    
    const ctx = document.getElementById('weightChart');
    if (ctx && appData.weight.length > 0) {
        if (window.weightChartInstance) window.weightChartInstance.destroy();
        window.weightChartInstance = new Chart(ctx, {
            type: 'line',
            data: { labels: appData.weight.map(w => w.date), datasets: [{ label: 'Вес (кг)', data: appData.weight.map(w => w.value), borderColor: '#ff9f0a', fill: true, tension: 0.3 }] },
            options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { labels: { color: '#8e8e93' } } } }
        });
    }
}

function updateWorkoutUI() {
    const today = new Date().toDateString();
    const todayWorkouts = appData.workouts.filter(w => w.date === today);
    const totals = todayWorkouts.reduce((acc, w) => { acc.minutes += w.minutes; acc.burned += w.burned || 0; return acc; }, { minutes: 0, burned: 0 });
    
    document.getElementById('totalWorkouts').innerText = todayWorkouts.length;
    document.getElementById('totalMinutes').innerText = totals.minutes;
    document.getElementById('totalBurned').innerText = totals.burned;
    
    const workoutList = document.getElementById('workoutList');
    if (workoutList) {
        workoutList.innerHTML = todayWorkouts.map(w => `<div class="workout-item"><div><strong>${w.name}</strong> — ${w.minutes} мин, 🔥${w.burned} ккал<br><small>${w.time}</small></div><button class="delete-btn" onclick="deleteWorkout(${w.id})">✖</button></div>`).join('');
        if (todayWorkouts.length === 0) workoutList.innerHTML = '<div style="color:#8e8e93; text-align:center;">Нет тренировок</div>';
    }
}

function updateHabitsUI() {
    const habitsList = document.getElementById('habitsList');
    if (habitsList) {
        habitsList.innerHTML = appData.habits.map(h => `<div class="habit-item"><input type="checkbox" class="habit-checkbox" ${h.completed ? 'checked' : ''} onchange="toggleHabit(${h.id})"><span class="habit-text ${h.completed ? 'completed' : ''}" style="flex:1; margin-left:12px;">${h.text}</span><button class="delete-btn" onclick="deleteHabit(${h.id})">✖</button></div>`).join('');
        if (appData.habits.length === 0) habitsList.innerHTML = '<div style="color:#8e8e93; text-align:center;">Добавьте привычку</div>';
    }
}

function updateStreak() {
    const today = new Date().toDateString();
    const hasActivity = appData.water.today > 0 || appData.food.filter(f => f.date === today).length > 0;
    if (hasActivity) {
        const lastDate = appData.streak.lastDate;
        if (lastDate === today) { }
        else if (lastDate === new Date(Date.now() - 86400000).toDateString()) { appData.streak.count++; }
        else if (lastDate !== today) { appData.streak.count = 1; }
        appData.streak.lastDate = today;
        saveData();
    }
    document.getElementById('streakDays').innerText = appData.streak.count;
}

function updateAllUI() {
    updateWaterUI();
    updateFoodUI();
    updateWeightUI();
    updateWorkoutUI();
    updateHabitsUI();
    updateStreak();
    
    // Обновляем имя пользователя
    const nameDisplay = document.getElementById('userNameDisplay');
    if (nameDisplay) nameDisplay.innerText = currentUser?.displayName || appData.userProfile.name || "Гость";
}

// ========== ДАТА И НАВИГАЦИЯ ==========
function updateDate() {
    const dateElem = document.getElementById('todayDate');
    if (dateElem) {
        const now = new Date();
        dateElem.innerText = now.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
    }
}

document.querySelectorAll('.tab-item').forEach(item => {
    item.addEventListener('click', () => {
        const tabId = item.getAttribute('data-tab');
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));
        item.classList.add('active');
        const activePage = document.getElementById(tabId);
        if (activePage) activePage.classList.add('active');
    });
});

document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        const targetTab = document.querySelector(`.tab-item[data-tab="${tabId}"]`);
        if (targetTab) targetTab.click();
    });
});

// Закрытие модалок по клику вне области
window.onclick = function(event) {
    const settingsModal = document.getElementById('settingsModal');
    const profileModal = document.getElementById('profileModal');
    if (event.target === settingsModal) closeSettingsModal();
    if (event.target === profileModal) closeProfileModal();
};

// Инициализация
updateDate();
loadData();
