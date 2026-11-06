/**
 * NutriTrack - Vanilla Calorie & Macro Tracker
 * Pure Vanilla JavaScript with browser localStorage persistence.
 */

(function () {
  'use strict';

  // -------------------------------------------------------------------------
  // LocalStorage Keys & Defaults
  // -------------------------------------------------------------------------
  const STORAGE_KEYS = {
    ENTRIES: 'nutritrack_food_entries_v1',
    SETTINGS: 'nutritrack_settings_v1',
    WATER: 'nutritrack_water_logs_v1'
  };

  const DEFAULT_SETTINGS = {
    dailyGoal: 2000,
    waterGoal: 2000
  };

  // -------------------------------------------------------------------------
  // App State
  // -------------------------------------------------------------------------
  let state = {
    currentDate: getTodayDateString(), // Format: YYYY-MM-DD
    entries: [],
    settings: { ...DEFAULT_SETTINGS },
    waterLogs: {},
    searchQuery: '',
    editingEntryId: null
  };

  // -------------------------------------------------------------------------
  // DOM Elements Cache
  // -------------------------------------------------------------------------
  const elements = {
    // Header & Actions
    openAddBtn: document.getElementById('open-add-btn'),
    openSettingsBtn: document.getElementById('open-settings-btn'),

    // Date Navigation
    prevDayBtn: document.getElementById('prev-day-btn'),
    nextDayBtn: document.getElementById('next-day-btn'),
    dateBadge: document.getElementById('date-label-badge'),
    currentDateHeading: document.getElementById('current-date-heading'),
    datePickerInput: document.getElementById('date-picker-input'),

    // Calorie Dashboard
    totalConsumedVal: document.getElementById('total-consumed-val'),
    remainingCalorieVal: document.getElementById('remaining-calorie-val'),
    remainingCalorieLabel: document.getElementById('remaining-calorie-label'),
    dailyGoalVal: document.getElementById('daily-goal-val'),
    progressCircle: document.getElementById('calorie-progress-circle'),
    linearProgressBar: document.getElementById('calorie-progress-bar'),
    progressPercentageLabel: document.getElementById('progress-percentage-label'),
    calorieStatusLabel: document.getElementById('calorie-status-label'),
    editGoalQuickBtn: document.getElementById('edit-goal-quick-btn'),

    // Macros
    proteinGrams: document.getElementById('protein-grams'),
    carbsGrams: document.getElementById('carbs-grams'),
    fatGrams: document.getElementById('fat-grams'),
    proteinCals: document.getElementById('protein-cals'),
    carbsCals: document.getElementById('carbs-cals'),
    fatCals: document.getElementById('fat-cals'),
    proteinBarFill: document.getElementById('protein-bar-fill'),
    carbsBarFill: document.getElementById('carbs-bar-fill'),
    fatBarFill: document.getElementById('fat-bar-fill'),

    // Water
    waterCurrentVal: document.getElementById('water-current-val'),
    waterGoalVal: document.getElementById('water-goal-val'),
    waterProgressBar: document.getElementById('water-progress-bar'),
    addWaterBtn: document.getElementById('add-water-btn'),
    addWater500Btn: document.getElementById('add-water-500-btn'),
    resetWaterBtn: document.getElementById('reset-water-btn'),

    // Presets & Search
    presetPills: document.querySelectorAll('.preset-pill'),
    foodSearchInput: document.getElementById('food-search-input'),

    // Meal Groups
    mealLists: {
      breakfast: document.getElementById('breakfast-items-list'),
      lunch: document.getElementById('lunch-items-list'),
      dinner: document.getElementById('dinner-items-list'),
      snacks: document.getElementById('snacks-items-list')
    },
    mealTotals: {
      breakfast: document.getElementById('breakfast-total-cal'),
      lunch: document.getElementById('lunch-total-cal'),
      dinner: document.getElementById('dinner-total-cal'),
      snacks: document.getElementById('snacks-total-cal')
    },

    // Food Modal
    foodModal: document.getElementById('food-modal'),
    foodModalTitle: document.getElementById('food-modal-title'),
    closeFoodModalBtn: document.getElementById('close-food-modal-btn'),
    cancelFoodBtn: document.getElementById('cancel-food-btn'),
    foodForm: document.getElementById('food-form'),
    entryIdInput: document.getElementById('entry-id-input'),
    foodNameInput: document.getElementById('food-name-input'),
    mealTypeSelect: document.getElementById('meal-type-select'),
    caloriesInput: document.getElementById('calories-input'),
    servingInput: document.getElementById('serving-input'),
    proteinInput: document.getElementById('protein-input'),
    carbsInput: document.getElementById('carbs-input'),
    fatInput: document.getElementById('fat-input'),

    // Settings Modal
    settingsModal: document.getElementById('settings-modal'),
    closeSettingsModalBtn: document.getElementById('close-settings-modal-btn'),
    cancelSettingsBtn: document.getElementById('cancel-settings-btn'),
    settingsForm: document.getElementById('settings-form'),
    goalCaloriesInput: document.getElementById('goal-calories-input'),
    goalWaterInput: document.getElementById('goal-water-input'),
    exportDataBtn: document.getElementById('export-data-btn'),
    importFileInput: document.getElementById('import-file-input'),
    clearAllDataBtn: document.getElementById('clear-all-data-btn'),

    // Toast
    toast: document.getElementById('toast')
  };

  // -------------------------------------------------------------------------
  // Date Utilities
  // -------------------------------------------------------------------------
  function getTodayDateString() {
    const today = new Date();
    return formatDateToString(today);
  }

  function formatDateToString(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function parseDateString(dateStr) {
    const parts = dateStr.split('-');
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  function formatDisplayDate(dateStr) {
    const d = parseDateString(dateStr);
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  }

  function getRelativeDateLabel(dateStr) {
    const todayStr = getTodayDateString();
    if (dateStr === todayStr) return 'Today';

    const cur = parseDateString(dateStr);
    const today = parseDateString(todayStr);
    const diffTime = cur.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays === -1) return 'Yesterday';
    if (diffDays === 1) return 'Tomorrow';
    return dateStr;
  }

  // -------------------------------------------------------------------------
  // LocalStorage Data Management
  // -------------------------------------------------------------------------
  function loadFromStorage() {
    try {
      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (storedSettings) {
        state.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) };
      } else {
        state.settings = { ...DEFAULT_SETTINGS };
      }

      const storedWater = localStorage.getItem(STORAGE_KEYS.WATER);
      state.waterLogs = storedWater ? JSON.parse(storedWater) : {};

      const storedEntries = localStorage.getItem(STORAGE_KEYS.ENTRIES);
      if (storedEntries) {
        state.entries = JSON.parse(storedEntries);
      } else {
        // First time initialization with pleasant starter entries for today
        state.entries = seedStarterEntries();
        saveEntries();
      }
    } catch (e) {
      console.error('Failed to parse localStorage data:', e);
      state.entries = [];
      state.settings = { ...DEFAULT_SETTINGS };
      state.waterLogs = {};
    }
  }

  function seedStarterEntries() {
    const today = getTodayDateString();
    return [
      {
        id: 'seed-1',
        date: today,
        mealType: 'breakfast',
        name: 'Oatmeal with Blueberries & Honey',
        calories: 320,
        portion: '1 medium bowl',
        protein: 11,
        carbs: 58,
        fat: 5,
        createdAt: Date.now() - 1000 * 60 * 180
      },
      {
        id: 'seed-2',
        date: today,
        mealType: 'breakfast',
        name: 'Black Coffee with splash of almond milk',
        calories: 25,
        portion: '250 ml',
        protein: 1,
        carbs: 2,
        fat: 1,
        createdAt: Date.now() - 1000 * 60 * 170
      },
      {
        id: 'seed-3',
        date: today,
        mealType: 'lunch',
        name: 'Grilled Chicken Caesar Salad',
        calories: 480,
        portion: '1 large plate',
        protein: 42,
        carbs: 18,
        fat: 26,
        createdAt: Date.now() - 1000 * 60 * 60
      }
    ];
  }

  function saveEntries() {
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(state.entries));
  }

  function saveSettings() {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
  }

  function saveWaterLogs() {
    localStorage.setItem(STORAGE_KEYS.WATER, JSON.stringify(state.waterLogs));
  }

  // -------------------------------------------------------------------------
  // Notifications (Toast)
  // -------------------------------------------------------------------------
  let toastTimer = null;
  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      elements.toast.classList.remove('show');
    }, 2800);
  }

  // -------------------------------------------------------------------------
  // Render Main Dashboard & Meals
  // -------------------------------------------------------------------------
  function render() {
    renderDateSection();
    renderOverview();
    renderWaterSection();
    renderMealLogs();
  }

  function renderDateSection() {
    elements.currentDateHeading.textContent = formatDisplayDate(state.currentDate);
    elements.dateBadge.textContent = getRelativeDateLabel(state.currentDate);
    elements.datePickerInput.value = state.currentDate;
  }

  function renderOverview() {
    const dailyEntries = state.entries.filter(e => e.date === state.currentDate);

    // Sum Calories
    const totalConsumed = dailyEntries.reduce((sum, item) => sum + (Number(item.calories) || 0), 0);
    const goal = Number(state.settings.dailyGoal) || 2000;
    const remaining = goal - totalConsumed;

    elements.totalConsumedVal.textContent = totalConsumed.toLocaleString();
    elements.dailyGoalVal.textContent = goal.toLocaleString();

    // Progress circle math (radius = 56, circumference = 2 * PI * 56 ≈ 351.86)
    const CIRCUMFERENCE = 351.86;
    const percent = goal > 0 ? (totalConsumed / goal) : 0;
    const offset = CIRCUMFERENCE - Math.min(percent, 1) * CIRCUMFERENCE;

    elements.progressCircle.style.strokeDashoffset = offset;

    // Remaining Calories & Color
    if (remaining >= 0) {
      elements.remainingCalorieVal.textContent = remaining.toLocaleString();
      elements.remainingCalorieLabel.textContent = 'kcal left';
      elements.progressCircle.style.stroke = '#ea580c';
      elements.linearProgressBar.style.background = 'linear-gradient(90deg, #ea580c 0%, #f97316 100%)';
      elements.calorieStatusLabel.textContent = 'On track';
      elements.calorieStatusLabel.style.color = '#16a34a';
    } else {
      elements.remainingCalorieVal.textContent = Math.abs(remaining).toLocaleString();
      elements.remainingCalorieLabel.textContent = 'kcal over budget';
      elements.progressCircle.style.stroke = '#dc2626';
      elements.linearProgressBar.style.background = '#dc2626';
      elements.calorieStatusLabel.textContent = 'Over budget';
      elements.calorieStatusLabel.style.color = '#dc2626';
    }

    // Linear bar
    const visualPercent = Math.min(Math.round(percent * 100), 100);
    elements.linearProgressBar.style.width = `${visualPercent}%`;
    elements.progressPercentageLabel.textContent = `${Math.round(percent * 100)}% of daily target`;

    // Sum Macros
    const totalProtein = dailyEntries.reduce((sum, item) => sum + (Number(item.protein) || 0), 0);
    const totalCarbs = dailyEntries.reduce((sum, item) => sum + (Number(item.carbs) || 0), 0);
    const totalFat = dailyEntries.reduce((sum, item) => sum + (Number(item.fat) || 0), 0);

    const proteinCalories = totalProtein * 4;
    const carbsCalories = totalCarbs * 4;
    const fatCalories = totalFat * 9;
    const macroCaloriesTotal = proteinCalories + carbsCalories + fatCalories;

    elements.proteinGrams.textContent = (Math.round(totalProtein * 10) / 10).toLocaleString();
    elements.carbsGrams.textContent = (Math.round(totalCarbs * 10) / 10).toLocaleString();
    elements.fatGrams.textContent = (Math.round(totalFat * 10) / 10).toLocaleString();

    elements.proteinCals.textContent = `${Math.round(proteinCalories)} kcal (4 kcal/g)`;
    elements.carbsCals.textContent = `${Math.round(carbsCalories)} kcal (4 kcal/g)`;
    elements.fatCals.textContent = `${Math.round(fatCalories)} kcal (9 kcal/g)`;

    // Macro proportional distribution bar
    if (macroCaloriesTotal > 0) {
      elements.proteinBarFill.style.width = `${Math.round((proteinCalories / macroCaloriesTotal) * 100)}%`;
      elements.carbsBarFill.style.width = `${Math.round((carbsCalories / macroCaloriesTotal) * 100)}%`;
      elements.fatBarFill.style.width = `${Math.round((fatCalories / macroCaloriesTotal) * 100)}%`;
    } else {
      elements.proteinBarFill.style.width = '0%';
      elements.carbsBarFill.style.width = '0%';
      elements.fatBarFill.style.width = '0%';
    }
  }

  function renderWaterSection() {
    const currentWater = state.waterLogs[state.currentDate] || 0;
    const goalWater = Number(state.settings.waterGoal) || 2000;

    elements.waterCurrentVal.textContent = currentWater.toLocaleString();
    elements.waterGoalVal.textContent = goalWater.toLocaleString();

    const percent = Math.min(Math.round((currentWater / goalWater) * 100), 100);
    elements.waterProgressBar.style.width = `${percent}%`;
  }

  function renderMealLogs() {
    const meals = ['breakfast', 'lunch', 'dinner', 'snacks'];
    const query = state.searchQuery.trim().toLowerCase();

    // Group items for the selected date
    const dayEntries = state.entries.filter(e => e.date === state.currentDate);

    meals.forEach(meal => {
      let items = dayEntries.filter(e => e.mealType === meal);
      const totalMealCalories = items.reduce((sum, item) => sum + (Number(item.calories) || 0), 0);
      elements.mealTotals[meal].textContent = totalMealCalories.toLocaleString();

      if (query) {
        items = items.filter(e => e.name.toLowerCase().includes(query) || (e.portion && e.portion.toLowerCase().includes(query)));
      }

      const listContainer = elements.mealLists[meal];
      listContainer.innerHTML = '';

      if (items.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-meal-placeholder';
        emptyDiv.textContent = query ? `No matching foods found in ${meal}` : `No ${meal} logged yet`;
        listContainer.appendChild(emptyDiv);
      } else {
        items.forEach(item => {
          const row = createFoodItemElement(item);
          listContainer.appendChild(row);
        });
      }
    });
  }

  function createFoodItemElement(item) {
    const row = document.createElement('div');
    row.className = 'food-item-row';
    row.dataset.id = item.id;

    // Left info
    const leftWrap = document.createElement('div');
    leftWrap.className = 'food-item-left';

    const title = document.createElement('div');
    title.className = 'food-item-title';
    title.textContent = item.name;
    leftWrap.appendChild(title);

    const details = document.createElement('div');
    details.className = 'food-item-details';

    if (item.portion) {
      const portionSpan = document.createElement('span');
      portionSpan.className = 'food-item-portion';
      portionSpan.textContent = item.portion;
      details.appendChild(portionSpan);
    }

    const hasMacros = item.protein > 0 || item.carbs > 0 || item.fat > 0;
    if (hasMacros) {
      if (item.protein > 0) {
        const pSpan = document.createElement('span');
        pSpan.className = 'food-item-macro-tag tag-p';
        pSpan.textContent = `P: ${item.protein}g`;
        details.appendChild(pSpan);
      }
      if (item.carbs > 0) {
        const cSpan = document.createElement('span');
        cSpan.className = 'food-item-macro-tag tag-c';
        cSpan.textContent = `C: ${item.carbs}g`;
        details.appendChild(cSpan);
      }
      if (item.fat > 0) {
        const fSpan = document.createElement('span');
        fSpan.className = 'food-item-macro-tag tag-f';
        fSpan.textContent = `F: ${item.fat}g`;
        details.appendChild(fSpan);
      }
    }

    leftWrap.appendChild(details);

    // Right info & actions
    const rightWrap = document.createElement('div');
    rightWrap.className = 'food-item-right';

    const calSpan = document.createElement('div');
    calSpan.className = 'food-item-calories';
    calSpan.textContent = `${Number(item.calories).toLocaleString()} kcal`;
    rightWrap.appendChild(calSpan);

    const actionsWrap = document.createElement('div');
    actionsWrap.className = 'food-item-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'action-icon-btn';
    editBtn.title = 'Edit item';
    editBtn.innerHTML = '✏️';
    editBtn.addEventListener('click', () => openEditFoodModal(item));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-icon-btn delete-btn';
    deleteBtn.title = 'Delete item';
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.addEventListener('click', () => deleteFoodItem(item.id));

    actionsWrap.appendChild(editBtn);
    actionsWrap.appendChild(deleteBtn);
    rightWrap.appendChild(actionsWrap);

    row.appendChild(leftWrap);
    row.appendChild(rightWrap);

    return row;
  }

  // -------------------------------------------------------------------------
  // Modals Management
  // -------------------------------------------------------------------------
  function openAddFoodModal(presetMealType = 'breakfast') {
    state.editingEntryId = null;
    elements.foodModalTitle.textContent = 'Log Food Item';
    elements.entryIdInput.value = '';
    elements.foodForm.reset();
    elements.mealTypeSelect.value = presetMealType;
    elements.foodModal.classList.add('open');
    elements.foodModal.setAttribute('aria-hidden', 'false');
    elements.foodNameInput.focus();
  }

  function openEditFoodModal(item) {
    state.editingEntryId = item.id;
    elements.foodModalTitle.textContent = 'Edit Food Item';
    elements.entryIdInput.value = item.id;
    elements.foodNameInput.value = item.name || '';
    elements.mealTypeSelect.value = item.mealType || 'breakfast';
    elements.caloriesInput.value = item.calories ?? '';
    elements.servingInput.value = item.portion || '';
    elements.proteinInput.value = item.protein !== undefined && item.protein !== null ? item.protein : '';
    elements.carbsInput.value = item.carbs !== undefined && item.carbs !== null ? item.carbs : '';
    elements.fatInput.value = item.fat !== undefined && item.fat !== null ? item.fat : '';

    elements.foodModal.classList.add('open');
    elements.foodModal.setAttribute('aria-hidden', 'false');
    elements.foodNameInput.focus();
  }

  function closeFoodModal() {
    elements.foodModal.classList.remove('open');
    elements.foodModal.setAttribute('aria-hidden', 'true');
    elements.foodForm.reset();
    state.editingEntryId = null;
  }

  function openSettingsModal() {
    elements.goalCaloriesInput.value = state.settings.dailyGoal;
    elements.goalWaterInput.value = state.settings.waterGoal;
    elements.settingsModal.classList.add('open');
    elements.settingsModal.setAttribute('aria-hidden', 'false');
    elements.goalCaloriesInput.focus();
  }

  function closeSettingsModal() {
    elements.settingsModal.classList.remove('open');
    elements.settingsModal.setAttribute('aria-hidden', 'true');
  }

  // -------------------------------------------------------------------------
  // Food Items Operations
  // -------------------------------------------------------------------------
  function handleFoodFormSubmit(e) {
    e.preventDefault();

    const name = elements.foodNameInput.value.trim();
    const mealType = elements.mealTypeSelect.value;
    const calories = Math.round(Number(elements.caloriesInput.value));
    const portion = elements.servingInput.value.trim();
    const protein = elements.proteinInput.value !== '' ? parseFloat(elements.proteinInput.value) : 0;
    const carbs = elements.carbsInput.value !== '' ? parseFloat(elements.carbsInput.value) : 0;
    const fat = elements.fatInput.value !== '' ? parseFloat(elements.fatInput.value) : 0;

    if (!name || isNaN(calories) || calories < 0) {
      showToast('Please enter a valid food name and calories.');
      return;
    }

    if (state.editingEntryId) {
      // Edit existing
      const index = state.entries.findIndex(item => item.id === state.editingEntryId);
      if (index !== -1) {
        state.entries[index] = {
          ...state.entries[index],
          name,
          mealType,
          calories,
          portion,
          protein: Math.max(0, protein),
          carbs: Math.max(0, carbs),
          fat: Math.max(0, fat)
        };
        showToast(`Updated "${name}"`);
      }
    } else {
      // Create new
      const newEntry = {
        id: 'entry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        date: state.currentDate,
        name,
        mealType,
        calories,
        portion,
        protein: Math.max(0, protein),
        carbs: Math.max(0, carbs),
        fat: Math.max(0, fat),
        createdAt: Date.now()
      };
      state.entries.push(newEntry);
      showToast(`Added ${calories} kcal (${name})`);
    }

    saveEntries();
    closeFoodModal();
    render();
  }

  function deleteFoodItem(id) {
    const item = state.entries.find(e => e.id === id);
    if (!item) return;

    state.entries = state.entries.filter(e => e.id !== id);
    saveEntries();
    showToast(`Removed "${item.name}"`);
    render();
  }

  function addQuickCalories(calories) {
    const newEntry = {
      id: 'quick_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      date: state.currentDate,
      name: `Quick Calorie Boost (+${calories} kcal)`,
      mealType: 'snacks',
      calories: calories,
      portion: '',
      protein: 0,
      carbs: 0,
      fat: 0,
      createdAt: Date.now()
    };
    state.entries.push(newEntry);
    saveEntries();
    showToast(`Added +${calories} kcal to Snacks!`);
    render();
  }

  // -------------------------------------------------------------------------
  // Water Tracker Operations
  // -------------------------------------------------------------------------
  function addWater(amount) {
    const current = state.waterLogs[state.currentDate] || 0;
    state.waterLogs[state.currentDate] = Math.max(0, current + amount);
    saveWaterLogs();
    showToast(`Hydration: +${amount} ml logged`);
    renderWaterSection();
  }

  function resetWater() {
    state.waterLogs[state.currentDate] = 0;
    saveWaterLogs();
    showToast('Water intake for today reset to 0 ml');
    renderWaterSection();
  }

  // -------------------------------------------------------------------------
  // Settings & Data Export/Import
  // -------------------------------------------------------------------------
  function handleSettingsSubmit(e) {
    e.preventDefault();
    const newCalorieGoal = parseInt(elements.goalCaloriesInput.value, 10);
    const newWaterGoal = parseInt(elements.goalWaterInput.value, 10);

    if (newCalorieGoal > 0) state.settings.dailyGoal = newCalorieGoal;
    if (newWaterGoal > 0) state.settings.waterGoal = newWaterGoal;

    saveSettings();
    closeSettingsModal();
    showToast('Goals updated successfully!');
    render();
  }

  function exportBackup() {
    const backupData = {
      version: 1,
      exportDate: new Date().toISOString(),
      settings: state.settings,
      waterLogs: state.waterLogs,
      entries: state.entries
    };

    const jsonString = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `nutritrack_backup_${getTodayDateString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Data backup exported successfully!');
  }

  function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported.entries)) {
          state.entries = imported.entries;
          saveEntries();
        }
        if (imported.settings && typeof imported.settings === 'object') {
          state.settings = { ...DEFAULT_SETTINGS, ...imported.settings };
          saveSettings();
        }
        if (imported.waterLogs && typeof imported.waterLogs === 'object') {
          state.waterLogs = imported.waterLogs;
          saveWaterLogs();
        }

        showToast('Backup restored successfully!');
        closeSettingsModal();
        render();
      } catch (err) {
        console.error('Import parse error:', err);
        showToast('Invalid backup file. Could not import.');
      }
      elements.importFileInput.value = '';
    };
    reader.readAsText(file);
  }

  function clearAllData() {
    const confirmed = window.confirm('Are you sure you want to delete ALL saved logs and reset to defaults? This cannot be undone.');
    if (!confirmed) return;

    localStorage.removeItem(STORAGE_KEYS.ENTRIES);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.WATER);

    state.entries = [];
    state.settings = { ...DEFAULT_SETTINGS };
    state.waterLogs = {};

    closeSettingsModal();
    showToast('All data has been cleared.');
    render();
  }

  // -------------------------------------------------------------------------
  // Date Shifting
  // -------------------------------------------------------------------------
  function shiftDate(days) {
    const cur = parseDateString(state.currentDate);
    cur.setDate(cur.getDate() + days);
    state.currentDate = formatDateToString(cur);
    render();
  }

  function setDate(dateString) {
    if (!dateString) return;
    state.currentDate = dateString;
    render();
  }

  // -------------------------------------------------------------------------
  // Event Listeners Binding
  // -------------------------------------------------------------------------
  function setupEventListeners() {
    // Navigation
    elements.prevDayBtn.addEventListener('click', () => shiftDate(-1));
    elements.nextDayBtn.addEventListener('click', () => shiftDate(1));
    elements.datePickerInput.addEventListener('change', (e) => setDate(e.target.value));

    // Modals open/close
    elements.openAddBtn.addEventListener('click', () => openAddFoodModal('breakfast'));
    elements.closeFoodModalBtn.addEventListener('click', closeFoodModal);
    elements.cancelFoodBtn.addEventListener('click', closeFoodModal);

    elements.openSettingsBtn.addEventListener('click', openSettingsModal);
    elements.editGoalQuickBtn.addEventListener('click', openSettingsModal);
    elements.closeSettingsModalBtn.addEventListener('click', closeSettingsModal);
    elements.cancelSettingsBtn.addEventListener('click', closeSettingsModal);

    // Form submissions
    elements.foodForm.addEventListener('submit', handleFoodFormSubmit);
    elements.settingsForm.addEventListener('submit', handleSettingsSubmit);

    // Close modal on click outside
    elements.foodModal.addEventListener('click', (e) => {
      if (e.target === elements.foodModal) closeFoodModal();
    });
    elements.settingsModal.addEventListener('click', (e) => {
      if (e.target === elements.settingsModal) closeSettingsModal();
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeFoodModal();
        closeSettingsModal();
      }
    });

    // Quick presets
    elements.presetPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const cal = Number(pill.dataset.cal);
        if (cal > 0) addQuickCalories(cal);
      });
    });

    // Add per meal type
    document.querySelectorAll('.add-meal-specific-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mealType = btn.dataset.mealType;
        openAddFoodModal(mealType);
      });
    });

    // Search filter
    elements.foodSearchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderMealLogs();
    });

    // Water tracker controls
    elements.addWaterBtn.addEventListener('click', () => addWater(250));
    elements.addWater500Btn.addEventListener('click', () => addWater(500));
    elements.resetWaterBtn.addEventListener('click', resetWater);

    // Data export / import / reset
    elements.exportDataBtn.addEventListener('click', exportBackup);
    elements.importFileInput.addEventListener('change', handleImportFile);
    elements.clearAllDataBtn.addEventListener('click', clearAllData);
  }

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------
  function init() {
    loadFromStorage();
    setupEventListeners();
    render();
  }

  // Launch when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

