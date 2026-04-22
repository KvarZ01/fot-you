let appData = {
    water: { today: 0 },
    food: [],
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
        calorieGoal: 2500,
        proteinGoal: 150,
        fatsGoal: 65,
        carbsGoal: 250
    }
};

function loadData() {
    const saved = localStorage.getItem('calzenData');
    if (saved) {
        appData = JSON.parse(saved);
    }
    updateAllUI();
}

function saveData() {
    localStorage.setItem('calzenData', JSON.stringify(appData));
}

function addWater(ml) {
    if (isNaN(ml) || ml <= 0) return;
    appData.water.today += ml;
    saveData();
    updateAllUI();
}

function addFood() {
    const name = document.getElementById('foodName').value;
    const cal = parseInt(document.getElementById('foodCal').value);
    const prot = parseInt(document.getElementById('foodProt').value) || 0;
    const fat = parseInt(document.getElementById('foodFat').value) || 0;
    const carb = parseInt(document.getElementById('foodCarb').value) || 0;
    const mealType = document.getElementById('foodMealType').value;
    
    if (!name || isNaN(cal)) {
        alert('Заполните название и калории');
        return;
    }
    
    const editingId = document.getElementById('editingFoodId').value;
    
    if (editingId) {
        const index = appData.food.findIndex(f => f.id == editingId);
        if (index !== -1) {
            appData.food[index] = {
                ...appData.food[index],
                name, calories: cal, protein: prot, fats: fat, carbs: carb, mealType,
                time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
            };
        }
    } else {
        appData.food.push({
            id: Date.now(),
            name, calories: cal, protein: prot, fats: fat, carbs: carb, mealType,
            time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
            date: new Date().toDateString()
        });
    }
    
    saveData();
    updateAllUI();
    document.getElementById('addFoodModal').style.display = 'none';
    document.getElementById('foodName').value = '';
    document.getElementById('foodCal').value = '';
    document.getElementById('foodProt').value = '';
    document.getElementById('foodFat').value = '';
    document.getElementById('foodCarb').value = '';
    document.getElementById('editingFoodId').value = '';
}

function deleteFood(id) {
    if (confirm('Удалить?')) {
        appData.food = appData.food.filter(f => f.id !== id);
        saveData();
        updateAllUI();
    }
}

function editFood(id) {
    const food = appData.food.find(f => f.id === id);
    if (food) {
        document.getElementById('editingFoodId').value = food.id;
        document.getElementById('foodName').value = food.name;
        document.getElementById('foodCal').value = food.calories;
        document.getElementById('foodProt').value = food.protein || 0;
        document.getElementById('foodFat').value = food.fats || 0;
        document.getElementById('foodCarb').value = food.carbs || 0;
        document.getElementById('foodMealType').value = food.mealType || 'snack';
        document.getElementById('foodModalTitle').innerHTML = '✏️ Редактировать еду';
        document.getElementById('confirmAddFoodBtn').innerHTML = 'Сохранить';
        document.getElementById('addFoodModal').style.display = 'flex';
    }
}

function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        document.getElementById('userFullName').value = appData.userProfile.name || '';
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
    document.getElementById('settingsModal').style.display = 'none';
}

function saveAllSettings() {
    appData.userProfile.name = document.getElementById('userFullName').value || 'Гость';
    appData.userProfile.weight = parseFloat(document.getElementById('userWeight').value) || 70;
    appData.userProfile.height = parseInt(document.getElementById('userHeight').value) || 170;
    appData.userProfile.age = parseInt(document.getElementById('userAge').value) || 30;
    appData.userProfile.gender = document.getElementById('userGender').value;
    appData.userProfile.activity = document.getElementById('userActivity').value;
    appData.userProfile.goal = document.getElementById('userGoal').value;
    
    const cal = parseInt(document.getElementById('setCalorieGoalModal').value);
    if (cal > 0) appData.settings.calorieGoal = cal;
    
    const prot = parseInt(document.getElementById('setProteinGoalModal').value);
    if (prot > 0) appData.settings.proteinGoal = prot;
    
    const fat = parseInt(document.getElementById('setFatsGoalModal').value);
    if (fat > 0) appData.settings.fatsGoal = fat;
    
    const carb = parseInt(document.getElementById('setCarbsGoalModal').value);
    if (carb > 0) appData.settings.carbsGoal = carb;
    
    const water = parseInt(document.getElementById('setWaterGoalModal').value);
    if (water > 0) appData.settings.waterGoal = water;
    
    saveData();
    updateAllUI();
    closeSettingsModal();
}

function updateAllUI() {
    const today = new Date().toDateString();
    const todayFood = appData.food.filter(f => f.date === today);
    
    const totals = todayFood.reduce((acc, f) => {
        acc.calories += f.calories;
        acc.protein += f.protein || 0;
        acc.fats += f.fats || 0;
        acc.carbs += f.carbs || 0;
        return acc;
    }, { calories: 0, protein: 0, fats: 0, carbs: 0 });
    
    const calPercent = Math.min((totals.calories / appData.settings.calorieGoal) * 100, 100);
    const ring = document.getElementById('calorieRingProgress');
    if (ring) {
        const circumference = 596.9;
        ring.style.strokeDashoffset = circumference - (calPercent / 100) * circumference;
    }
    
    document.getElementById('calorieCurrent').innerText = totals.calories;
    document.getElementById('calorieTarget').innerText = appData.settings.calorieGoal;
    
    const proteinPercent = Math.min((totals.protein / appData.settings.proteinGoal) * 100, 100);
    const fatsPercent = Math.min((totals.fats / appData.settings.fatsGoal) * 100, 100);
    const carbsPercent = Math.min((totals.carbs / appData.settings.carbsGoal) * 100, 100);
    
    document.getElementById('proteinCurrent').innerText = totals.protein;
    document.getElementById('proteinTarget').innerText = appData.settings.proteinGoal;
    document.getElementById('proteinFill').style.width = proteinPercent + '%';
    
    document.getElementById('fatsCurrent').innerText = totals.fats;
    document.getElementById('fatsTarget').innerText = appData.settings.fatsGoal;
    document.getElementById('fatsFill').style.width = fatsPercent + '%';
    
    document.getElementById('carbsCurrent').innerText = totals.carbs;
    document.getElementById('carbsTarget').innerText = appData.settings.carbsGoal;
    document.getElementById('carbsFill').style.width = carbsPercent + '%';
    
    const waterPercent = Math.min((appData.water.today / appData.settings.waterGoal) * 100, 100);
    document.getElementById('waterCurrent').innerText = appData.water.today;
    document.getElementById('waterTarget').innerText = appData.settings.waterGoal;
    document.getElementById('waterFill').style.width = waterPercent + '%';
    
    const historyList = document.getElementById('mealsHistoryList');
    if (historyList) {
        historyList.innerHTML = todayFood.map(f => `
            <div class="history-item">
                <div class="history-item-info">
                    <div class="history-item-name">${f.name}</div>
                    <div class="history-item-details">${f.time}</div>
                    <div class="history-item-macros">${f.calories} ккал | белки ${f.protein}г | жиры ${f.fats}г | углеводы ${f.carbs}г</div>
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="edit-history-btn" onclick="editFood(${f.id})">✏️</button>
                    <button class="delete-history-btn" onclick="deleteFood(${f.id})">🗑️</button>
                </div>
            </div>
        `).join('');
        if (todayFood.length === 0) {
            historyList.innerHTML = '<div style="color:#8e8e93; text-align:center; padding:20px;">Нет записей</div>';
        }
        document.getElementById('mealsCount').innerText = todayFood.length;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadData();
    
    document.getElementById('settingsButton').onclick = openSettingsModal;
    document.getElementById('closeSettingsBtn').onclick = closeSettingsModal;
    document.getElementById('saveSettingsBtn').onclick = saveAllSettings;
    
    document.getElementById('addFoodMainBtn').onclick = function() {
        document.getElementById('editingFoodId').value = '';
        document.getElementById('foodName').value = '';
        document.getElementById('foodCal').value = '';
        document.getElementById('foodProt').value = '';
        document.getElementById('foodFat').value = '';
        document.getElementById('foodCarb').value = '';
        document.getElementById('foodModalTitle').innerHTML = '🍽️ Добавить еду';
        document.getElementById('confirmAddFoodBtn').innerHTML = 'Добавить';
        document.getElementById('addFoodModal').style.display = 'flex';
    };
    document.getElementById('closeAddFoodBtn').onclick = function() {
        document.getElementById('addFoodModal').style.display = 'none';
    };
    document.getElementById('confirmAddFoodBtn').onclick = addFood;
    
    document.querySelectorAll('[data-water]').forEach(btn => {
        btn.onclick = () => addWater(parseInt(btn.getAttribute('data-water')));
    });
    
    window.onclick = function(event) {
        if (event.target === document.getElementById('settingsModal')) closeSettingsModal();
        if (event.target === document.getElementById('addFoodModal')) {
            document.getElementById('addFoodModal').style.display = 'none';
        }
    };
});
