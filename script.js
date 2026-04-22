// ========== ГЛОБАЛЬНЫЕ ДАННЫЕ ==========
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

let selectedImageFile = null;

// ========== ЗАГРУЗКА/СОХРАНЕНИЕ ==========
function loadData() {
    const saved = localStorage.getItem('calzenData');
    if (saved) {
        appData = JSON.parse(saved);
    } else {
        recalculateCaloriesFromProfile();
    }
    updateAllUI();
}

function saveData() {
    localStorage.setItem('calzenData', JSON.stringify(appData));
}

// ========== РАСЧЁТ КАЛОРИЙ ==========
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
    
    if (appData.userProfile.goal === "lose") {
        tdee -= 500;
    } else if (appData.userProfile.goal === "gain") {
        tdee += 300;
    }
    
    tdee = Math.max(1200, Math.round(tdee));
    
    const proteinGoal = Math.round((tdee * 0.3) / 4);
    const fatsGoal = Math.round((tdee * 0.25) / 9);
    const carbsGoal = Math.round((tdee * 0.45) / 4);
    
    appData.settings.calorieGoal = tdee;
    appData.settings.proteinGoal = proteinGoal;
    appData.settings.fatsGoal = fatsGoal;
    appData.settings.carbsGoal = carbsGoal;
    
    if (appData.userProfile.weight) {
        appData.settings.waterGoal = Math.round(appData.userProfile.weight * 33);
    }
    
    saveData();
}

// ========== НАСТРОЙКИ ==========
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

function saveAllSettings() {
    appData.userProfile.name = document.getElementById('userFullName')?.value || "Гость";
    appData.userProfile.weight = parseFloat(document.getElementById('userWeight')?.value) || 70;
    appData.userProfile.height = parseInt(document.getElementById('userHeight')?.value) || 170;
    appData.userProfile.age = parseInt(document.getElementById('userAge')?.value) || 30;
    appData.userProfile.gender = document.getElementById('userGender')?.value || "male";
    appData.userProfile.activity = document.getElementById('userActivity')?.value || "1.55";
    appData.userProfile.goal = document.getElementById('userGoal')?.value || "maintain";
    
    const manualCal = document.getElementById('setCalorieGoalModal')?.value;
    const manualProtein = document.getElementById('setProteinGoalModal')?.value;
    const manualFats = document.getElementById('setFatsGoalModal')?.value;
    const manualCarbs = document.getElementById('setCarbsGoalModal')?.value;
    const manualWater = document.getElementById('setWaterGoalModal')?.value;
    
    if (manualCal && parseInt(manualCal) > 0) {
        appData.settings.calorieGoal = parseInt(manualCal);
    } else {
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

// ========== ВОДА ==========
function addWater(ml) {
    if (isNaN(ml) || ml <= 0) return;
    appData.water.today += ml;
    saveData();
    updateAllUI();
}

// ========== ЕДА ==========
function openAddFoodModal() {
    const modal = document.getElementById('addFoodModal');
    if (modal) modal.style.display = 'flex';
}

function closeAddFoodModal() {
    const modal = document.getElementById('addFoodModal');
    if (modal) modal.style.display = 'none';
}

function addFood() {
    const name = document.getElementById('foodName')?.value;
    const cal = parseInt(document.getElementById('foodCal')?.value);
    const prot = parseInt(document.getElementById('foodProt')?.value) || 0;
    const fat = parseInt(document.getElementById('foodFat')?.value) || 0;
    const carb = parseInt(document.getElementById('foodCarb')?.value) || 0;
    const mealType = document.getElementById('foodMealType')?.value;
    
    if (!name || isNaN(cal)) {
        alert('Заполните название и калории');
        return;
    }
    
    appData.food.push({
        id: Date.now(),
        name,
        calories: cal,
        protein: prot,
        fats: fat,
        carbs: carb,
        mealType,
        time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
        date: new Date().toDateString()
    });
    
    saveData();
    updateAllUI();
    closeAddFoodModal();
    
    // Очистка формы
    document.getElementById('foodName').value = '';
    document.getElementById('foodCal').value = '';
    document.getElementById('foodProt').value = '';
    document.getElementById('foodFat').value = '';
    document.getElementById('foodCarb').value = '';
}

function deleteFood(id) {
    appData.food = appData.food.filter(f => f.id !== id);
    saveData();
    updateAllUI();
}

// ========== ИИ АНАЛИЗ ==========
function openAIModal() {
    const modal = document.getElementById('aiModal');
    if (modal) {
        document.getElementById('aiPreview').classList.add('hidden');
        document.getElementById('aiResult').classList.add('hidden');
        selectedImageFile = null;
        modal.style.display = 'flex';
    }
}

function closeAIModal() {
    const modal = document.getElementById('aiModal');
    if (modal) modal.style.display = 'none';
}

function selectImageFromGallery() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedImageFile = file;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const previewImg = document.getElementById('aiPreviewImg');
                previewImg.src = ev.target.result;
                document.getElementById('aiPreview').classList.remove('hidden');
                document.getElementById('aiResult').classList.add('hidden');
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

function takePhoto() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedImageFile = file;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const previewImg = document.getElementById('aiPreviewImg');
                previewImg.src = ev.target.result;
                document.getElementById('aiPreview').classList.remove('hidden');
                document.getElementById('aiResult').classList.add('hidden');
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

async function analyzeFoodWithAI() {
    if (!selectedImageFile) {
        alert('Сначала выберите фото');
        return;
    }
    
    const resultDiv = document.getElementById('aiResult');
    resultDiv.classList.remove('hidden');
    resultDiv.innerHTML = "🔄 ИИ анализирует блюдо...";
    
    const reader = new FileReader();
    reader.onloadend = async function() {
        const base64 = reader.result.split(',')[1];
        
        const apiKey = "AIzaSyD3nF7kLmP9xR2vB5hJ8qW1eC4tY6uI0oP";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const prompt = `Ты эксперт по питанию. Проанализируй еду на фото. Ответь ТОЛЬКО в формате JSON: {"name":"название","calories":число,"protein":число,"fats":число,"carbs":число}. Если не видно еду - поставь "Не определено" и 0.`;
        
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
                <button onclick="quickAddFromAI('${result.name || "Блюдо"}', ${result.calories || 0}, ${result.protein || 0}, ${result.fats || 0}, ${result.carbs || 0})" style="margin-top:12px; background:#ff3b30; border:none; padding:10px 20px; border-radius:30px; color:white; font-weight:600; cursor:pointer;">✅ Добавить в дневник</button>
            `;
        } catch(e) {
            resultDiv.innerHTML = "❌ Ошибка анализа. Попробуйте другое фото.";
        }
    };
    reader.readAsDataURL(selectedImageFile);
}

function quickAddFromAI(name, cal, prot, fat, carb) {
    appData.food.push({
        id: Date.now(),
        name: name,
        calories: cal,
        protein: prot,
        fats: fat,
        carbs: carb,
        mealType: "snack",
        time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
        date: new Date().toDateString()
    });
    saveData();
    updateAllUI();
    closeAIModal();
}

// ========== ОБНОВЛЕНИЕ UI ==========
function updateAllUI() {
    const today = new Date().toDateString();
    const todayFood = appData.food.filter(f => f.date === today);
    
    // Суммарные значения
    const totals = todayFood.reduce((acc, f) => {
        acc.calories += f.calories;
        acc.protein += f.protein || 0;
        acc.fats += f.fats || 0;
        acc.carbs += f.carbs || 0;
        return acc;
    }, { calories: 0, protein: 0, fats: 0, carbs: 0 });
    
    // Кольцо калорий
    const calPercent = Math.min((totals.calories / appData.settings.calorieGoal) * 100, 100);
    const ring = document.getElementById('calorieRingProgress');
    if (ring) {
        const circumference = 596.9;
        const offset = circumference - (calPercent / 100) * circumference;
        ring.style.strokeDashoffset = offset;
    }
    document.getElementById('calorieCurrent').innerText = totals.calories;
    document.getElementById('calorieTarget').innerText = appData.settings.calorieGoal;
    
    // БЖУ полоски
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
    
    // Вода
    const waterPercent = Math.min((appData.water.today / appData.settings.waterGoal) * 100, 100);
    document.getElementById('waterCurrent').innerText = appData.water.today;
    document.getElementById('waterTarget').innerText = appData.settings.waterGoal;
    document.getElementById('waterFill').style.width = waterPercent + '%';
    
    // История приёмов пищи
    const historyList = document.getElementById('mealsHistoryList');
    const mealsCount = document.getElementById('mealsCount');
    if (historyList) {
        historyList.innerHTML = todayFood.map(f => `
            <div class="history-item">
                <div class="history-item-info">
                    <div class="history-item-name">${f.name}</div>
                    <div class="history-item-details">${f.time} • ${f.mealType === 'breakfast' ? '🍳 Завтрак' : f.mealType === 'lunch' ? '🥗 Обед' : f.mealType === 'dinner' ? '🍲 Ужин' : '🍎 Перекус'}</div>
                </div>
                <div style="display:flex; align-items:center;">
                    <div class="history-item-calories">${f.calories} ккал</div>
                    <button class="delete-history-btn" onclick="deleteFood(${f.id})">✖</button>
                </div>
            </div>
        `).join('');
        if (todayFood.length === 0) {
            historyList.innerHTML = '<div style="color:#8e8e93; text-align:center; padding:20px;">Нет записей за сегодня</div>';
        }
        if (mealsCount) mealsCount.innerText = todayFood.length;
    }
}

// Закрытие модалок по клику вне
window.onclick = function(event) {
    const settingsModal = document.getElementById('settingsModal');
    const addFoodModal = document.getElementById('addFoodModal');
    const aiModal = document.getElementById('aiModal');
    if (event.target === settingsModal) closeSettingsModal();
    if (event.target === addFoodModal) closeAddFoodModal();
    if (event.target === aiModal) closeAIModal();
};

// Инициализация
loadData();
