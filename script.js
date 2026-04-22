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

// ========== ВОДА ==========
function addWater(ml) {
    if (isNaN(ml) || ml <= 0) return;
    appData.water.today += ml;
    saveData();
    updateAllUI();
}

function openEditWaterModal() {
    const modal = document.getElementById('editWaterModal');
    if (modal) {
        document.getElementById('editWaterAmount').value = appData.water.today;
        modal.style.display = 'flex';
    }
}

function closeEditWaterModal() {
    const modal = document.getElementById('editWaterModal');
    if (modal) modal.style.display = 'none';
}

function saveWaterEdit() {
    const newAmount = parseInt(document.getElementById('editWaterAmount')?.value);
    if (!isNaN(newAmount) && newAmount >= 0) {
        appData.water.today = newAmount;
        saveData();
        updateAllUI();
        closeEditWaterModal();
    } else {
        alert('Введите корректное значение');
    }
}

function resetWater() {
    if (confirm('Сбросить всю воду за сегодня?')) {
        appData.water.today = 0;
        saveData();
        updateAllUI();
        closeEditWaterModal();
    }
}

// ========== ЕДА ==========
function openAddFoodModal(editId = null) {
    const modal = document.getElementById('addFoodModal');
    const modalTitle = document.getElementById('foodModalTitle');
    const confirmBtn = document.getElementById('confirmAddFoodBtn');
    
    if (editId) {
        const foodToEdit = appData.food.find(f => f.id === editId);
        if (foodToEdit) {
            document.getElementById('editingFoodId').value = editId;
            document.getElementById('foodName').value = foodToEdit.name;
            document.getElementById('foodCal').value = foodToEdit.calories;
            document.getElementById('foodProt').value = foodToEdit.protein || 0;
            document.getElementById('foodFat').value = foodToEdit.fats || 0;
            document.getElementById('foodCarb').value = foodToEdit.carbs || 0;
            document.getElementById('foodMealType').value = foodToEdit.mealType || 'snack';
            if (modalTitle) modalTitle.innerHTML = '✏️ Редактировать еду';
            if (confirmBtn) confirmBtn.innerHTML = '💾 Сохранить изменения';
        }
    } else {
        document.getElementById('editingFoodId').value = '';
        document.getElementById('foodName').value = '';
        document.getElementById('foodCal').value = '';
        document.getElementById('foodProt').value = '';
        document.getElementById('foodFat').value = '';
        document.getElementById('foodCarb').value = '';
        document.getElementById('foodMealType').value = 'snack';
        if (modalTitle) modalTitle.innerHTML = '🍽️ Добавить еду';
        if (confirmBtn) confirmBtn.innerHTML = 'Добавить';
    }
    
    if (modal) modal.style.display = 'flex';
}

function closeAddFoodModal() {
    const modal = document.getElementById('addFoodModal');
    if (modal) modal.style.display = 'none';
}

function saveFood() {
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
    
    const editingId = document.getElementById('editingFoodId')?.value;
    
    if (editingId) {
        const index = appData.food.findIndex(f => f.id == editingId);
        if (index !== -1) {
            appData.food[index] = {
                ...appData.food[index],
                name: name,
                calories: cal,
                protein: prot,
                fats: fat,
                carbs: carb,
                mealType: mealType,
                time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
            };
        }
    } else {
        appData.food.push({
            id: Date.now(),
            name: name,
            calories: cal,
            protein: prot,
            fats: fat,
            carbs: carb,
            mealType: mealType,
            time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
            date: new Date().toDateString()
        });
    }
    
    saveData();
    updateAllUI();
    closeAddFoodModal();
}

function deleteFood(id) {
    if (confirm('Удалить этот приём пищи?')) {
        appData.food = appData.food.filter(f => f.id !== id);
        saveData();
        updateAllUI();
    }
}

function editFood(id) {
    openAddFoodModal(id);
}

// ========== НАСТРОЙКИ (ГЛАВНАЯ ФУНКЦИЯ) ==========
function openSettingsModal() {
    console.log('openSettingsModal вызвана'); // Диагностика
    const modal = document.getElementById('settingsModal');
    console.log('modal элемент:', modal); // Диагностика
    
    if (modal) {
        // Заполняем поля текущими значениями
        const userNameInput = document.getElementById('userFullName');
        const userWeightInput = document.getElementById('userWeight');
        const userHeightInput = document.getElementById('userHeight');
        const userAgeInput = document.getElementById('userAge');
        const userGenderSelect = document.getElementById('userGender');
        const userActivitySelect = document.getElementById('userActivity');
        const userGoalSelect = document.getElementById('userGoal');
        const calorieGoalInput = document.getElementById('setCalorieGoalModal');
        const proteinGoalInput = document.getElementById('setProteinGoalModal');
        const fatsGoalInput = document.getElementById('setFatsGoalModal');
        const carbsGoalInput = document.getElementById('setCarbsGoalModal');
        const waterGoalInput = document.getElementById('setWaterGoalModal');
        
        if (userNameInput) userNameInput.value = appData.userProfile.name || "";
        if (userWeightInput) userWeightInput.value = appData.userProfile.weight;
        if (userHeightInput) userHeightInput.value = appData.userProfile.height;
        if (userAgeInput) userAgeInput.value = appData.userProfile.age;
        if (userGenderSelect) userGenderSelect.value = appData.userProfile.gender;
        if (userActivitySelect) userActivitySelect.value = appData.userProfile.activity;
        if (userGoalSelect) userGoalSelect.value = appData.userProfile.goal;
        if (calorieGoalInput) calorieGoalInput.value = appData.settings.calorieGoal;
        if (proteinGoalInput) proteinGoalInput.value = appData.settings.proteinGoal;
        if (fatsGoalInput) fatsGoalInput.value = appData.settings.fatsGoal;
        if (carbsGoalInput) carbsGoalInput.value = appData.settings.carbsGoal;
        if (waterGoalInput) waterGoalInput.value = appData.settings.waterGoal;
        
        modal.style.display = 'flex';
        console.log('Модалка открыта');
    } else {
        console.error('Модальное окно settingsModal не найдено в DOM');
        alert('Ошибка: окно настроек не найдено. Проверьте HTML.');
    }
}

function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.style.display = 'none';
}

function saveAllSettings() {
    console.log('saveAllSettings вызвана');
    
    const nameInput = document.getElementById('userFullName');
    const weightInput = document.getElementById('userWeight');
    const heightInput = document.getElementById('userHeight');
    const ageInput = document.getElementById('userAge');
    const genderSelect = document.getElementById('userGender');
    const activitySelect = document.getElementById('userActivity');
    const goalSelect = document.getElementById('userGoal');
    const calorieInput = document.getElementById('setCalorieGoalModal');
    const proteinInput = document.getElementById('setProteinGoalModal');
    const fatsInput = document.getElementById('setFatsGoalModal');
    const carbsInput = document.getElementById('setCarbsGoalModal');
    const waterInput = document.getElementById('setWaterGoalModal');
    
    if (nameInput) appData.userProfile.name = nameInput.value || "Гость";
    if (weightInput) appData.userProfile.weight = parseFloat(weightInput.value) || 70;
    if (heightInput) appData.userProfile.height = parseInt(heightInput.value) || 170;
    if (ageInput) appData.userProfile.age = parseInt(ageInput.value) || 30;
    if (genderSelect) appData.userProfile.gender = genderSelect.value;
    if (activitySelect) appData.userProfile.activity = activitySelect.value;
    if (goalSelect) appData.userProfile.goal = goalSelect.value;
    
    const manualCal = calorieInput ? parseInt(calorieInput.value) : null;
    const manualProtein = proteinInput ? parseInt(proteinInput.value) : null;
    const manualFats = fatsInput ? parseInt(fatsInput.value) : null;
    const manualCarbs = carbsInput ? parseInt(carbsInput.value) : null;
    const manualWater = waterInput ? parseInt(waterInput.value) : null;
    
    if (manualCal && manualCal > 0) {
        appData.settings.calorieGoal = manualCal;
    } else {
        recalculateCaloriesFromProfile();
    }
    
    if (manualProtein && manualProtein > 0) appData.settings.proteinGoal = manualProtein;
    if (manualFats && manualFats > 0) appData.settings.fatsGoal = manualFats;
    if (manualCarbs && manualCarbs > 0) appData.settings.carbsGoal = manualCarbs;
    if (manualWater && manualWater > 0) appData.settings.waterGoal = manualWater;
    
    saveData();
    updateAllUI();
    closeSettingsModal();
    console.log('Настройки сохранены');
}

// ========== ИИ АНАЛИЗ ==========
function openAIModal() {
    const modal = document.getElementById('aiModal');
    if (modal) {
        const aiPreview = document.getElementById('aiPreview');
        const aiResult = document.getElementById('aiResult');
        if (aiPreview) aiPreview.classList.add('hidden');
        if (aiResult) aiResult.classList.add('hidden');
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
                if (previewImg) previewImg.src = ev.target.result;
                const aiPreview = document.getElementById('aiPreview');
                if (aiPreview) aiPreview.classList.remove('hidden');
                const aiResult = document.getElementById('aiResult');
                if (aiResult) aiResult.classList.add('hidden');
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
                if (previewImg) previewImg.src = ev.target.result;
                const aiPreview = document.getElementById('aiPreview');
                if (aiPreview) aiPreview.classList.remove('hidden');
                const aiResult = document.getElementById('aiResult');
                if (aiResult) aiResult.classList.add('hidden');
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
    if (resultDiv) {
        resultDiv.classList.remove('hidden');
        resultDiv.innerHTML = "🔄 ИИ анализирует блюдо...";
    }
    
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
            
            if (resultDiv) {
                resultDiv.innerHTML = `
                    <strong>🤖 ИИ определил:</strong><br>
                    🍲 ${result.name || "Блюдо"}<br>
                    🔥 ${result.calories || 0} ккал | 🥩 ${result.protein || 0}г | 🧈 ${result.fats || 0}г | 🍚 ${result.carbs || 0}г
                    <button id="quickAddFromAIBtn" style="margin-top:12px; background:#ff3b30; border:none; padding:10px 20px; border-radius:30px; color:white; font-weight:600; cursor:pointer;">✅ Добавить в дневник</button>
                `;
                
                const quickBtn = document.getElementById('quickAddFromAIBtn');
                if (quickBtn) {
                    quickBtn.onclick = function() {
                        quickAddFromAI(result.name || "Блюдо", result.calories || 0, result.protein || 0, result.fats || 0, result.carbs || 0);
                    };
                }
            }
        } catch(e) {
            if (resultDiv) resultDiv.innerHTML = "❌ Ошибка анализа. Попробуйте другое фото.";
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
    
    const calorieCurrent = document.getElementById('calorieCurrent');
    const calorieTarget = document.getElementById('calorieTarget');
    if (calorieCurrent) calorieCurrent.innerText = totals.calories;
    if (calorieTarget) calorieTarget.innerText = appData.settings.calorieGoal;
    
    // БЖУ
    const proteinPercent = Math.min((totals.protein / appData.settings.proteinGoal) * 100, 100);
    const fatsPercent = Math.min((totals.fats / appData.settings.fatsGoal) * 100, 100);
    const carbsPercent = Math.min((totals.carbs / appData.settings.carbsGoal) * 100, 100);
    
    const proteinCurrent = document.getElementById('proteinCurrent');
    const proteinTarget = document.getElementById('proteinTarget');
    const proteinFill = document.getElementById('proteinFill');
    if (proteinCurrent) proteinCurrent.innerText = totals.protein;
    if (proteinTarget) proteinTarget.innerText = appData.settings.proteinGoal;
    if (proteinFill) proteinFill.style.width = proteinPercent + '%';
    
    const fatsCurrent = document.getElementById('fatsCurrent');
    const fatsTarget = document.getElementById('fatsTarget');
    const fatsFill = document.getElementById('fatsFill');
    if (fatsCurrent) fatsCurrent.innerText = totals.fats;
    if (fatsTarget) fatsTarget.innerText = appData.settings.fatsGoal;
    if (fatsFill) fatsFill.style.width = fatsPercent + '%';
    
    const carbsCurrent = document.getElementById('carbsCurrent');
    const carbsTarget = document.getElementById('carbsTarget');
    const carbsFill = document.getElementById('carbsFill');
    if (carbsCurrent) carbsCurrent.innerText = totals.carbs;
    if (carbsTarget) carbsTarget.innerText = appData.settings.carbsGoal;
    if (carbsFill) carbsFill.style.width = carbsPercent + '%';
    
    // Вода
    const waterPercent = Math.min((appData.water.today / appData.settings.waterGoal) * 100, 100);
    const waterCurrent = document.getElementById('waterCurrent');
    const waterTarget = document.getElementById('waterTarget');
    const waterFill = document.getElementById('waterFill');
    if (waterCurrent) waterCurrent.innerText = appData.water.today;
    if (waterTarget) waterTarget.innerText = appData.settings.waterGoal;
    if (waterFill) waterFill.style.width = waterPercent + '%';
    
    // История
    const historyList = document.getElementById('mealsHistoryList');
    const mealsCount = document.getElementById('mealsCount');
    if (historyList) {
        historyList.innerHTML = todayFood.map(f => `
            <div class="history-item">
                <div class="history-item-info">
                    <div class="history-item-name">${escapeHtml(f.name)}</div>
                    <div class="history-item-details">${f.time} • ${f.mealType === 'breakfast' ? '🍳 Завтрак' : f.mealType === 'lunch' ? '🥗 Обед' : f.mealType === 'dinner' ? '🍲 Ужин' : '🍎 Перекус'}</div>
                    <div class="history-item-macros">🔥${f.calories}ккал 🥩${f.protein}г 🧈${f.fats}г 🍚${f.carbs}г</div>
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="edit-history-btn" onclick="editFood(${f.id})">✏️</button>
                    <button class="delete-history-btn" onclick="deleteFood(${f.id})">🗑️</button>
                </div>
            </div>
        `).join('');
        if (todayFood.length === 0) {
            historyList.innerHTML = '<div style="color:#8e8e93; text-align:center; padding:20px;">Нет записей за сегодня</div>';
        }
        if (mealsCount) mealsCount.innerText = todayFood.length;
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ========== ИНИЦИАЛИЗАЦИЯ ОБРАБОТЧИКОВ ==========
function initEventListeners() {
    console.log('initEventListeners вызвана');
    
    // Шестерёнка (НАСТРОЙКИ) - ПРЯМОЕ НАЗНАЧЕНИЕ
    const settingsBtn = document.getElementById('settingsButton');
    if (settingsBtn) {
        console.log('Кнопка настроек найдена, назначаю обработчик');
        settingsBtn.onclick = function(e) {
            e.preventDefault();
            console.log('Клик по шестерёнке');
            openSettingsModal();
        };
    } else {
        console.error('Кнопка settingsButton НЕ найдена в DOM');
    }
    
    // Закрытие модалок через крестики
    const closeSettings = document.getElementById('closeSettingsModal');
    if (closeSettings) closeSettings.onclick = closeSettingsModal;
    
    const closeAddFood = document.getElementById('closeAddFoodModal');
    if (closeAddFood) closeAddFood.onclick = closeAddFoodModal;
    
    const closeAI = document.getElementById('closeAIModal');
    if (closeAI) closeAI.onclick = closeAIModal;
    
    const closeEditWater = document.getElementById('closeEditWaterModal');
    if (closeEditWater) closeEditWater.onclick = closeEditWaterModal;
    
    // Кнопка добавления еды
    const addFoodMain = document.getElementById('addFoodMainBtn');
    if (addFoodMain) addFoodMain.onclick = function() { openAddFoodModal(); };
    
    // Подтверждение добавления/редактирования еды
    const confirmAdd = document.getElementById('confirmAddFoodBtn');
    if (confirmAdd) confirmAdd.onclick = saveFood;
    
    // Сохранение настроек
    const saveSettings = document.getElementById('saveSettingsBtn');
    if (saveSettings) saveSettings.onclick = saveAllSettings;
    
    // ИИ кнопка
    const aiFab = document.getElementById('aiFabButton');
    if (aiFab) aiFab.onclick = openAIModal;
    
    // Кнопки выбора фото
    const galleryBtn = document.getElementById('galleryBtn');
    if (galleryBtn) galleryBtn.onclick = selectImageFromGallery;
    
    const cameraBtn = document.getElementById('cameraBtn');
    if (cameraBtn) cameraBtn.onclick = takePhoto;
    
    // Кнопка распознавания
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) analyzeBtn.onclick = analyzeFoodWithAI;
    
    // Кнопки воды
    const waterBtns = document.querySelectorAll('[data-water]');
    waterBtns.forEach(btn => {
        btn.onclick = function() {
            const ml = parseInt(this.getAttribute('data-water'));
            addWater(ml);
        };
    });
    
    // Кнопка редактирования воды
    const editWaterBtn = document.getElementById('editWaterBtn');
    if (editWaterBtn) editWaterBtn.onclick = openEditWaterModal;
    
    // Сохранение редактирования воды
    const saveWaterBtn = document.getElementById('saveWaterBtn');
    if (saveWaterBtn) saveWaterBtn.onclick = saveWaterEdit;
    
    // Сброс воды
    const resetWaterBtn = document.getElementById('resetWaterBtn');
    if (resetWaterBtn) resetWaterBtn.onclick = resetWater;
    
    // Закрытие по клику вне модалки
    window.onclick = function(event) {
        const settingsModal = document.getElementById('settingsModal');
        const addFoodModal = document.getElementById('addFoodModal');
        const aiModal = document.getElementById('aiModal');
        const editWaterModal = document.getElementById('editWaterModal');
        if (event.target === settingsModal) closeSettingsModal();
        if (event.target === addFoodModal) closeAddFoodModal();
        if (event.target === aiModal) closeAIModal();
        if (event.target === editWaterModal) closeEditWaterModal();
    };
}

// ========== ЗАПУСК ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен');
    loadData();
    initEventListeners();
});
